#!/usr/bin/env bash
set -uo pipefail

TEMPLATE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_BASE="$(mktemp -d)/pfm-matrix"
rm -rf "$OUT_BASE"
mkdir -p "$OUT_BASE"

data_sources=(postgres bigquery google-sheets external-api-only)
auths=(clerk google-oauth cloudflare-access none)
bools=(true false)

total=0
fail=0
declare -a failures=()

for ds in "${data_sources[@]}"; do
  for au in "${auths[@]}"; do
    for i18n in "${bools[@]}"; do
      for test in "${bools[@]}"; do
        for storage in "${bools[@]}"; do
          for storybook in "${bools[@]}"; do
            total=$((total+1))
            name="v${total}-${ds}-${au}-i${i18n}-t${test}-s${storage}-sb${storybook}"
            dest="$OUT_BASE/$name"
            out=$(copier copy "$TEMPLATE" "$dest" --vcs-ref=HEAD \
              --data project_name="$name" \
              --data owner="test-matrix@propfirmmatch.com" \
              --data data_source="$ds" \
              --data auth="$au" \
              --data enable_i18n="$i18n" \
              --data enable_testing="$test" \
              --data enable_file_storage="$storage" \
              --data enable_storybook="$storybook" \
              --defaults --quiet 2>&1)
            code=$?
            if [ $code -ne 0 ]; then
              fail=$((fail+1))
              failures+=("$name :: $out")
            else
              # sanity: no unrendered jinja braces should remain in any filename
              if find "$dest" -name '*{%*' -o -name '*{{*' | grep -q .; then
                fail=$((fail+1))
                failures+=("$name :: unrendered jinja filename left over")
              fi
              rm -rf "$dest"
            fi
          done
        done
      done
    done
  done
done

echo "TOTAL=$total FAIL=$fail"
if [ ${#failures[@]} -gt 0 ]; then
  echo "--- FAILURES ---"
  printf '%s\n\n' "${failures[@]}"
  exit 1
fi
