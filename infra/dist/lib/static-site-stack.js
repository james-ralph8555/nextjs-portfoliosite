"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsPortfoliositeSiteStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const aws_cloudfront_1 = require("aws-cdk-lib/aws-cloudfront");
const aws_s3_deployment_1 = require("aws-cdk-lib/aws-s3-deployment");
const aws_cloudfront_2 = require("aws-cdk-lib/aws-cloudfront");
const aws_cloudfront_origins_1 = require("aws-cdk-lib/aws-cloudfront-origins");
class NextjsPortfoliositeSiteStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props = {}) {
        super(scope, id, props);
        // Resolve deployment source path for the site assets
        // - default: repo root `out/` (static export)
        // - override: `-c distPath=/abs/path` when invoking CDK
        const contextDist = this.node.tryGetContext('distPath');
        const distPath = contextDist ?? path_1.default.resolve(__dirname, '../../out');
        if (!(0, fs_1.existsSync)(distPath)) {
            throw new Error(`Static export not found at: ${distPath}. Run 'npm run build' from repo root or pass '-c distPath=/abs/path'.`);
        }
        const siteBucket = new aws_s3_1.Bucket(this, 'SiteBucket', {
            blockPublicAccess: aws_s3_1.BlockPublicAccess.BLOCK_ALL,
            encryption: aws_s3_1.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            versioned: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            autoDeleteObjects: false,
            cors: [
                {
                    allowedMethods: [aws_s3_1.HttpMethods.GET, aws_s3_1.HttpMethods.HEAD],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                },
            ],
        });
        const originAccessIdentity = new aws_cloudfront_1.OriginAccessIdentity(this, 'OriginAccessIdentity', {
            comment: 'Access identity for the NextjsPortfoliosite static site bucket',
        });
        const responseHeadersPolicy = new aws_cloudfront_2.ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
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
        });
        const originPolicy = new aws_cloudfront_2.OriginRequestPolicy(this, 'OriginRequestPolicy', {
            cookieBehavior: aws_cloudfront_2.OriginRequestCookieBehavior.none(),
            headerBehavior: aws_cloudfront_2.OriginRequestHeaderBehavior.none(),
            queryStringBehavior: aws_cloudfront_2.OriginRequestQueryStringBehavior.none(),
        });
        const defaultBehavior = {
            origin: aws_cloudfront_origins_1.S3BucketOrigin.withOriginAccessIdentity(siteBucket, {
                originAccessIdentity,
            }),
            viewerProtocolPolicy: aws_cloudfront_2.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: aws_cloudfront_2.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            cachedMethods: aws_cloudfront_2.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            cachePolicy: aws_cloudfront_2.CachePolicy.CACHING_OPTIMIZED,
            originRequestPolicy: originPolicy,
            responseHeadersPolicy,
            compress: true,
        };
        const errorResponses = [
            {
                httpStatus: 403,
                responseHttpStatus: 200,
                responsePagePath: '/index.html',
                ttl: aws_cdk_lib_1.Duration.minutes(5),
            },
            {
                httpStatus: 404,
                responseHttpStatus: 200,
                responsePagePath: '/index.html',
                ttl: aws_cdk_lib_1.Duration.minutes(5),
            },
        ];
        const distribution = new aws_cloudfront_2.Distribution(this, 'SiteDistribution', {
            defaultBehavior,
            defaultRootObject: 'index.html',
            comment: 'NextjsPortfoliosite static site distribution',
            errorResponses,
        });
        new aws_s3_deployment_1.BucketDeployment(this, 'DeployWithInvalidation', {
            sources: [aws_s3_deployment_1.Source.asset(distPath)],
            destinationBucket: siteBucket,
            distribution,
            distributionPaths: ['/*'],
            cacheControl: [
                aws_s3_deployment_1.CacheControl.fromString('public, max-age=0, must-revalidate'),
            ],
            prune: true,
            // Large model assets can make uploads slow; increase
            // Lambda memory to speed up uploads.
            memoryLimit: 2048,
        });
        new aws_cdk_lib_1.CfnOutput(this, 'BucketName', {
            value: siteBucket.bucketName,
        });
        new aws_cdk_lib_1.CfnOutput(this, 'CloudFrontDistributionId', {
            value: distribution.distributionId,
        });
        new aws_cdk_lib_1.CfnOutput(this, 'CloudFrontDomainName', {
            value: distribution.domainName,
        });
    }
}
exports.NextjsPortfoliositeSiteStack = NextjsPortfoliositeSiteStack;
