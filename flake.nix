{
  description = "Kubernetes resource replicator";

  inputs = {
    hotPot.url = "github:shopstic/nix-hot-pot";
    nixpkgs.follows = "hotPot/nixpkgs";
    flakeUtils.follows = "hotPot/flakeUtils";
  };

  outputs = { self, nixpkgs, flakeUtils, hotPot }:
    flakeUtils.lib.eachSystem [ "aarch64-darwin" "aarch64-linux" "x86_64-darwin" "x86_64-linux" ]
      (system:
        let
          pkgs = import nixpkgs { inherit system; };
          hotPotPkgs = hotPot.packages.${system};
          deno = hotPotPkgs.deno;
          kubectl = pkgs.kubectl;
          k8sResourceReplicator = pkgs.callPackage hotPot.lib.denoAppBuild {
            inherit deno;
            name = "k8s-resource-replicator";
            src = builtins.path
              {
                path = ./.;
                name = "k8s-resource-replicator-src";
                filter = with pkgs.lib; (path: /* type */_:
                  hasInfix "/src" path ||
                  hasSuffix "/lock.json" path
                );
              };
            appSrcPath = "./src/app.ts";
          };
        in
        rec {
          defaultPackage = k8sResourceReplicator;
          packages = pkgs.lib.optionalAttrs pkgs.stdenv.isLinux {
            image = pkgs.callPackage ./image {
              inherit deno kubectl k8sResourceReplicator;
              inherit (pkgs) dumb-init;
              buildahBuild = pkgs.callPackage hotPot.lib.buildahBuild;
            };
          };
          devShell = pkgs.mkShellNoCC {
            buildInputs = builtins.attrValues {
              inherit deno kubectl;
              inherit (pkgs) skopeo;
            };
          };
        }
      );
}
