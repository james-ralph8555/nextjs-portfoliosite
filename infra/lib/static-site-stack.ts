import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Size,
  Stack,
  StackProps,
} from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import {
  AllowedMethods,
  BehaviorOptions,
  CachedMethods,
  CachePolicy,
  Distribution,
  ErrorResponse,
  OriginRequestCookieBehavior,
  OriginRequestHeaderBehavior,
  OriginRequestPolicy,
  OriginRequestQueryStringBehavior,
  ResponseHeadersPolicy,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  HttpMethods,
} from 'aws-cdk-lib/aws-s3'
import {
  BucketDeployment,
  CacheControl,
  Source,
} from 'aws-cdk-lib/aws-s3-deployment'
import { existsSync } from 'fs'
import path from 'path'
import { Construct } from 'constructs'
import hostedApps from '../../hosted-apps.json'

type ResponseHeadersProfile = 'standard' | 'cross-origin-isolated'

interface HostedSiteConfig {
  id: string
  publicName: string
  artifactPath: string
  domainAliases: string[]
  defaultRootObject: string
  fallbackPagePath: string
  responseHeaders: ResponseHeadersProfile
}

interface HostedAppsManifest {
  sites: HostedSiteConfig[]
}

export interface NextjsPortfoliositeSiteStackProps extends StackProps {
  certificateArn?: string
}

const manifest = hostedApps as HostedAppsManifest

function logicalPrefix(id: string): string {
  return id
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function constructId(site: HostedSiteConfig, suffix: string): string {
  return site.id === 'portfolio' ? suffix : `${logicalPrefix(site.id)}${suffix}`
}

function resolveDistPath(site: HostedSiteConfig, stack: Stack): string {
  const contextKey = site.id === 'portfolio' ? 'distPath' : `distPath:${site.id}`
  const contextDist = stack.node.tryGetContext(contextKey) as string | undefined
  return contextDist ?? path.resolve(process.cwd(), '..', site.artifactPath)
}

export class NextjsPortfoliositeSiteStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: NextjsPortfoliositeSiteStackProps = {},
  ) {
    super(scope, id, props)

    const certificate = props.certificateArn
      ? acm.Certificate.fromCertificateArn(
          this,
          'SiteCertificate',
          props.certificateArn,
        )
      : undefined

    if (!certificate) {
      // eslint-disable-next-line no-console
      console.warn(
        'SITE_CERTIFICATE_ARN (or -c certificateArn=...) is not set. Distributions will use CloudFront hostnames until redeployed with the james-ralph.com wildcard certificate.',
      )
    }

    const originPolicy = new OriginRequestPolicy(this, 'OriginRequestPolicy', {
      cookieBehavior: OriginRequestCookieBehavior.none(),
      headerBehavior: OriginRequestHeaderBehavior.none(),
      queryStringBehavior: OriginRequestQueryStringBehavior.none(),
    })

    for (const site of manifest.sites) {
      const distPath = resolveDistPath(site, this)
      const hasDist = existsSync(distPath)

      if (!hasDist) {
        // eslint-disable-next-line no-console
        console.warn(
          `Build artifacts for ${site.id} were not found at ${distPath}. Skipping asset deployment for this site.`,
        )
      }

      const siteBucket = new Bucket(this, constructId(site, 'SiteBucket'), {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        encryption: BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        versioned: true,
        removalPolicy: RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
        cors: [
          {
            allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
          },
        ],
      })

      const originAccessIdentity = new OriginAccessIdentity(
        this,
        constructId(site, 'OriginAccessIdentity'),
        { comment: `Access identity for ${site.publicName}` },
      )

      const responseHeadersPolicy =
        site.responseHeaders === 'cross-origin-isolated'
          ? new ResponseHeadersPolicy(
              this,
              constructId(site, 'ResponseHeadersPolicy'),
              {
                customHeadersBehavior: {
                  customHeaders: [
                    {
                      header: 'Cross-Origin-Opener-Policy',
                      value: 'same-origin',
                      override: true,
                    },
                    {
                      header: 'Cross-Origin-Embedder-Policy',
                      value: 'require-corp',
                      override: true,
                    },
                  ],
                },
              },
            )
          : undefined

      const defaultBehavior: BehaviorOptions = {
        origin: S3BucketOrigin.withOriginAccessIdentity(siteBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: originPolicy,
        responseHeadersPolicy,
        compress: true,
      }

      const errorResponses: ErrorResponse[] = [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: site.fallbackPagePath,
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: site.fallbackPagePath,
          ttl: Duration.minutes(5),
        },
      ]

      const distribution = new Distribution(
        this,
        constructId(site, 'SiteDistribution'),
        {
          defaultBehavior,
          defaultRootObject: site.defaultRootObject,
          comment: `${site.publicName} static site distribution`,
          errorResponses,
          ...(certificate
            ? {
                certificate,
                domainNames: site.domainAliases,
                minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
              }
            : {}),
        },
      )

      if (hasDist) {
        new BucketDeployment(
          this,
          constructId(site, 'DeployWithInvalidation'),
          {
            sources: [Source.asset(distPath)],
            destinationBucket: siteBucket,
            distribution,
            distributionPaths: ['/*'],
            cacheControl: [
              CacheControl.fromString('public, max-age=0, must-revalidate'),
            ],
            prune: true,
            memoryLimit: 2048,
            ephemeralStorageSize: Size.mebibytes(2048),
          },
        )
      }

      new CfnOutput(this, constructId(site, 'BucketName'), {
        value: siteBucket.bucketName,
      })
      new CfnOutput(
        this,
        constructId(site, 'CloudFrontDistributionId'),
        { value: distribution.distributionId },
      )
      new CfnOutput(
        this,
        constructId(site, 'CloudFrontDomainName'),
        { value: distribution.domainName },
      )
      new CfnOutput(this, constructId(site, 'ConfiguredDomainAliases'), {
        value: site.domainAliases.join(', '),
      })
    }
  }
}
