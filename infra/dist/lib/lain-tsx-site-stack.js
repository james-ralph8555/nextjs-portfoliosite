"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsPortfoliositeLainTsxSiteStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const aws_cloudfront_1 = require("aws-cdk-lib/aws-cloudfront");
const aws_s3_deployment_1 = require("aws-cdk-lib/aws-s3-deployment");
const aws_cloudfront_2 = require("aws-cdk-lib/aws-cloudfront");
const aws_cloudfront_origins_1 = require("aws-cdk-lib/aws-cloudfront-origins");
const acm = __importStar(require("aws-cdk-lib/aws-certificatemanager"));
class NextjsPortfoliositeLainTsxSiteStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props = {}) {
        super(scope, id, props);
        // Domain and certificate wiring
        // Accept a single domain or a comma/space-separated list via `-c lainDomain="a.example.com,b.example.com"`
        const rawDomainInput = this.node.tryGetContext('lainDomain');
        const sanitize = (d) => d
            .trim()
            .toLowerCase()
            // strip protocol if mistakenly provided
            .replace(/^https?:\/\//, '')
            // drop any path/query after the hostname
            .replace(/\/.*$/, '')
            // drop trailing dot
            .replace(/\.$/, '');
        const domains = (rawDomainInput ? rawDomainInput.split(/[\s,]+/) : ['laintsx.james-ralph.com'])
            .map(sanitize)
            .filter(Boolean);
        // Basic validation to catch obvious CloudFront alias mistakes early
        const aliasPattern = /^(\*\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
        for (const a of domains) {
            if (!aliasPattern.test(a)) {
                throw new Error(`Invalid CloudFront alias: "${a}". Provide bare domain(s) without protocol or paths, e.g. "app.example.com".`);
            }
        }
        const certificateArn = this.node.tryGetContext('certificateArn') ||
            process.env.CERTIFICATE_ARN ||
            // Import from the certificate stack export (must exist in the same account)
            aws_cdk_lib_1.Fn.importValue('NextjsPortfoliositeCertificateArn');
        const certificate = acm.Certificate.fromCertificateArn(this, 'ImportedCertificate', certificateArn);
        // Resolve deployment source path for the LainTSX assets
        // default: repo root `public/lainTSX/dist`
        // override: `-c lainDistPath=/abs/path` when invoking CDK
        // Note: use repo-root resolution so it works under ts-node (infra/lib) and compiled runs (infra/dist/lib)
        const contextDist = this.node.tryGetContext('lainDistPath');
        const defaultDist = path_1.default.resolve(process.cwd(), '../public/lainTSX/dist');
        const distPath = contextDist ?? defaultDist;
        const hasDist = (0, fs_1.existsSync)(distPath);
        if (!hasDist) {
            // Do not fail app synthesis when only deploying other stacks.
            // We will simply skip the BucketDeployment if assets are missing.
            // When you intend to deploy this stack, build first or pass '-c lainDistPath=/abs/path'.
            // eslint-disable-next-line no-console
            console.warn(`LainTSX static assets not found at: ${distPath}. Skipping asset deployment for NextjsPortfoliositeLainTsxSiteStack. Build or provide '-c lainDistPath=/abs/path'.`);
        }
        const bucket = new aws_s3_1.Bucket(this, 'LainTsxBucket', {
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
        const oai = new aws_cloudfront_1.OriginAccessIdentity(this, 'LainTsxOAI', {
            comment: 'OAI for LainTSX static site bucket',
        });
        const responseHeadersPolicy = new aws_cloudfront_2.ResponseHeadersPolicy(this, 'LainTsxResponseHeaders', {
            customHeadersBehavior: {
                customHeaders: [
                    { header: 'Cross-Origin-Opener-Policy', value: 'same-origin', override: true },
                    { header: 'Cross-Origin-Embedder-Policy', value: 'require-corp', override: true },
                ],
            },
        });
        const originPolicy = new aws_cloudfront_2.OriginRequestPolicy(this, 'LainTsxOriginRequest', {
            cookieBehavior: aws_cloudfront_2.OriginRequestCookieBehavior.none(),
            headerBehavior: aws_cloudfront_2.OriginRequestHeaderBehavior.none(),
            queryStringBehavior: aws_cloudfront_2.OriginRequestQueryStringBehavior.none(),
        });
        const defaultBehavior = {
            origin: aws_cloudfront_origins_1.S3BucketOrigin.withOriginAccessIdentity(bucket, { originAccessIdentity: oai }),
            viewerProtocolPolicy: aws_cloudfront_2.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: aws_cloudfront_2.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            cachedMethods: aws_cloudfront_2.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            cachePolicy: aws_cloudfront_2.CachePolicy.CACHING_OPTIMIZED,
            originRequestPolicy: originPolicy,
            responseHeadersPolicy,
            compress: true,
        };
        const errorResponses = [
            { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: aws_cdk_lib_1.Duration.minutes(5) },
            { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: aws_cdk_lib_1.Duration.minutes(5) },
        ];
        const distribution = new aws_cloudfront_2.Distribution(this, 'LainTsxDistribution', {
            defaultBehavior,
            defaultRootObject: 'index.html',
            comment: 'LainTSX static site distribution',
            errorResponses,
            domainNames: domains,
            certificate,
        });
        if (hasDist) {
            new aws_s3_deployment_1.BucketDeployment(this, 'LainTsxDeploy', {
                sources: [aws_s3_deployment_1.Source.asset(distPath)],
                destinationBucket: bucket,
                distribution,
                distributionPaths: ['/*'],
                cacheControl: [aws_s3_deployment_1.CacheControl.fromString('public, max-age=0, must-revalidate')],
                prune: true,
                memoryLimit: 2048,
                ephemeralStorageSize: aws_cdk_lib_1.Size.gibibytes(8),
            });
        }
        new aws_cdk_lib_1.CfnOutput(this, 'LainTsxBucketName', { value: bucket.bucketName });
        new aws_cdk_lib_1.CfnOutput(this, 'LainTsxDistributionId', { value: distribution.distributionId });
        new aws_cdk_lib_1.CfnOutput(this, 'LainTsxCloudFrontDomainName', { value: distribution.domainName });
    }
}
exports.NextjsPortfoliositeLainTsxSiteStack = NextjsPortfoliositeLainTsxSiteStack;
