export const BARE_METAL_INSTANCE_TYPES = [
  'm5.metal',
  'm5d.metal',
  'm5dn.metal',
  'm5n.metal',
  'm5zn.metal',
  'm6a.metal',
  'm6g.metal',
  'm6gd.metal',
  'm6i.metal',
  'm6id.metal',
  'm6idn.metal',
  'm6in.metal',
  'm7g.metal',
];

export interface Vars {
  ssmRoleName: string;
  nestedVirt: boolean;
  ec2Instance: {
    instanceType: string;
  };
  images: string[];
  repository: {
    url: string;
    dir: string;
  };
  dockerComposeVersion: string;
  containerLabVersion: string;
  ssh: {
    allowInboundSSH: string
    allowInboundSSHFrom: string[];
    privateKeyPath: string;
  }
}
