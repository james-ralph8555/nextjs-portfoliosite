#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const certificate_stack_1 = require("../lib/certificate-stack");
const static_site_stack_1 = require("../lib/static-site-stack");
const app = new aws_cdk_lib_1.App();
const defaultAccount = process.env.CDK_DEFAULT_ACCOUNT;
const defaultRegion = process.env.CDK_DEFAULT_REGION;
const certificateEnv = {
    account: process.env.CERTIFICATE_ACCOUNT ?? defaultAccount,
    region: process.env.CERTIFICATE_REGION ?? defaultRegion,
};
new certificate_stack_1.PagesonicCertificateStack(app, 'PagesonicCertificateStack', {
    env: certificateEnv,
    domainName: 'page-sonic.com',
});
const siteEnv = {
    account: process.env.SITE_ACCOUNT ?? defaultAccount,
    region: process.env.SITE_REGION ?? defaultRegion,
};
new static_site_stack_1.PagesonicSiteStack(app, 'PagesonicSiteStack', {
    env: siteEnv,
});
