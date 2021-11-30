{ lib
, stdenv
, deno
, dumb-init
, kubectl
, writeTextFile
, buildahBuild
, dockerTools
, k8sResourceReplicator
}:
let
  name = "k8s-resource-replicator";
  baseImage = buildahBuild
    {
      name = "${name}-base";
      context = ./context;
      buildArgs = {
        fromDigest = "sha256:626ffe58f6e7566e00254b638eb7e0f3b11d4da9675088f4781a50ae288f3322";
      };
      outputHash =
        if stdenv.isx86_64 then
          "sha256-x6AynjGFGP+fWrgwlbBq1kWrqas18lnh7Chc8FE6W+o=" else
          "sha256-+epxvc6eQ9e/D3Zgkke0Du40jtPNDtm895UtWZ4ZhXA=";
    };
  entrypoint = writeTextFile {
    name = "entrypoint";
    executable = true;
    text = ''
      #!/usr/bin/env bash
      set -euo pipefail
      exec dumb-init -- ${k8sResourceReplicator}/bin/k8s-resource-replicator
    '';
  };    
  baseImageWithDeps = dockerTools.buildImage {
    name = name;
    fromImage = baseImage;
    config = {
      Env = [
        "PATH=${lib.makeBinPath [ deno dumb-init kubectl ]}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
      ];
    };
  };
in
dockerTools.buildLayeredImage {
  name = name;
  fromImage = baseImageWithDeps;
  config = {
    Entrypoint = [ entrypoint ];
  };
}

