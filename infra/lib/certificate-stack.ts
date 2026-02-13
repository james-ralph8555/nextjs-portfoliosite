import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export interface NextjsPortfoliositeCertificateStackProps extends StackProps {
  domainName: string;
}

export class NextjsPortfoliositeCertificateStack extends Stack {
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: NextjsPortfoliositeCertificateStackProps) {
    super(scope, id, props);

    const { domainName } = props;

    this.certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName,
      // Include wildcard for all subdomains.
      subjectAlternativeNames: [
        `www.${domainName}`,
        `*.${domainName}`,
      ],
      // DNS validation without automatic record creation; we'll verify manually.
      validation: acm.CertificateValidation.fromDns(),
    });

    new CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'ARN of the ACM certificate (us-east-1)',
      exportName: 'NextjsPortfoliositeCertificateArn',
    });
  }
}
