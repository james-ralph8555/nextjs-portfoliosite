import {
  CfnOutput,
  Duration,
  Fn,
  RemovalPolicy,
  Size,
  Stack,
  StackProps,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'
import path from 'path'
import { existsSync } from 'fs'
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  HttpMethods,
} from 'aws-cdk-lib/aws-s3'
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'
import { BucketDeployment, CacheControl, Source } from 'aws-cdk-lib/aws-s3-deployment'
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
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'

export class NextjsPortfoliositeLainTsxSiteStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props)

    // Domain and certificate wiring
    // Accept a single domain or a comma/space-separated list via `-c lainDomain="a.example.com,b.example.com"`
    const rawDomainInput = this.node.tryGetContext('lainDomain') as string | undefined
    const sanitize = (d: string) =>
      d
        .trim()
        .toLowerCase()
        // strip protocol if mistakenly provided
        .replace(/^https?:\/\//, '')
        // drop any path/query after the hostname
        .replace(/\/.*$/, '')
        // drop trailing dot
        .replace(/\.$/, '')
    const domains = (rawDomainInput ? rawDomainInput.split(/[\s,]+/) : ['laintsx.james-ralph.com'])
      .map(sanitize)
      .filter(Boolean)

    // Basic validation to catch obvious CloudFront alias mistakes early
    const aliasPattern = /^(\*\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/
    for (const a of domains) {
      if (!aliasPattern.test(a)) {
        throw new Error(
          `Invalid CloudFront alias: "${a}". Provide bare domain(s) without protocol or paths, e.g. "app.example.com".`,
        )
      }
    }
    const certificateArn =
      (this.node.tryGetContext('certificateArn') as string | undefined) ||
      process.env.CERTIFICATE_ARN ||
      // Import from the certificate stack export (must exist in the same account)
      Fn.importValue('NextjsPortfoliositeCertificateArn')

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'ImportedCertificate',
      certificateArn,
    )

    // Resolve deployment source path for the LainTSX assets
    // default: repo root `public/lainTSX/dist`
    // override: `-c lainDistPath=/abs/path` when invoking CDK
    const contextDist = this.node.tryGetContext('lainDistPath') as string | undefined
    const distPath = contextDist ?? path.resolve(__dirname, '../../public/lainTSX/dist')

    if (!existsSync(distPath)) {
      throw new Error(
        `LainTSX static assets not found at: ${distPath}. Build or provide '-c lainDistPath=/abs/path'.`,
      )
    }

    const bucket = new Bucket(this, 'LainTsxBucket', {
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

    const oai = new OriginAccessIdentity(this, 'LainTsxOAI', {
      comment: 'OAI for LainTSX static site bucket',
    })

    const responseHeadersPolicy = new ResponseHeadersPolicy(this, 'LainTsxResponseHeaders', {
      customHeadersBehavior: {
        customHeaders: [
          { header: 'Cross-Origin-Opener-Policy', value: 'same-origin', override: true },
          { header: 'Cross-Origin-Embedder-Policy', value: 'require-corp', override: true },
        ],
      },
    })

    const originPolicy = new OriginRequestPolicy(this, 'LainTsxOriginRequest', {
      cookieBehavior: OriginRequestCookieBehavior.none(),
      headerBehavior: OriginRequestHeaderBehavior.none(),
      queryStringBehavior: OriginRequestQueryStringBehavior.none(),
    })

    const defaultBehavior: BehaviorOptions = {
      origin: S3BucketOrigin.withOriginAccessIdentity(bucket, { originAccessIdentity: oai }),
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      originRequestPolicy: originPolicy,
      responseHeadersPolicy,
      compress: true,
    }

    const errorResponses: ErrorResponse[] = [
      { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.minutes(5) },
      { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.minutes(5) },
    ]

    const distribution = new Distribution(this, 'LainTsxDistribution', {
      defaultBehavior,
      defaultRootObject: 'index.html',
      comment: 'LainTSX static site distribution',
      errorResponses,
      domainNames: domains,
      certificate,
    })

    new BucketDeployment(this, 'LainTsxDeploy', {
      sources: [Source.asset(distPath)],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
      cacheControl: [CacheControl.fromString('public, max-age=0, must-revalidate')],
      prune: true,
      memoryLimit: 2048,
      ephemeralStorageSize: Size.gibibytes(8),
    })

    new CfnOutput(this, 'LainTsxBucketName', { value: bucket.bucketName })
    new CfnOutput(this, 'LainTsxDistributionId', { value: distribution.distributionId })
    new CfnOutput(this, 'LainTsxCloudFrontDomainName', { value: distribution.domainName })
  }
}
