KUBE_PS1_CTX_COLOR=white
KUBE_PS1_SYMBOL_COLOR=cyan
source /root/kube-ps1.sh
PROMPT='$(kube_ps1)'$PROMPT
export PATH="/root/.krew/bin:/root/.deno/bin:$PATH"

if ! ls /app >/dev/null 2>&1; then
  ln -s "${PWD}" /app
fi

SAVEHIST=1000
HISTFILE=/app/.shell-history