#!/usr/bin/env node
import 'source-map-support/register'
import { App, Environment } from 'aws-cdk-lib'
import { NextjsPortfoliositeCertificateStack } from '../lib/certificate-stack'
import { NextjsPortfoliositeSiteStack } from '../lib/static-site-stack'
import { NextjsPortfoliositeLainTsxSiteStack } from '../lib/lain-tsx-site-stack'

const app = new App()

const defaultAccount = process.env.CDK_DEFAULT_ACCOUNT
const defaultRegion = process.env.CDK_DEFAULT_REGION

const certificateEnv: Environment = {
  account: process.env.CERTIFICATE_ACCOUNT ?? defaultAccount,
  region: process.env.CERTIFICATE_REGION ?? defaultRegion,
}

new NextjsPortfoliositeCertificateStack(app, 'NextjsPortfoliositeCertificateStack', {
  env: certificateEnv,
  domainName: 'james-ralph.com',
})

const siteEnv: Environment = {
  account: process.env.SITE_ACCOUNT ?? defaultAccount,
  region: process.env.SITE_REGION ?? defaultRegion,
}

new NextjsPortfoliositeSiteStack(app, 'NextjsPortfoliositeSiteStack', {
  env: siteEnv,
})

new NextjsPortfoliositeLainTsxSiteStack(app, 'NextjsPortfoliositeLainTsxSiteStack', {
  env: siteEnv,
})
