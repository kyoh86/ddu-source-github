" Functions to request denops functions
" They may simplify to get response

function ddu#kind#github#request#patch_body(bufnr, url) abort
  call ddu#source#github#patch_body(a:bufnr, a:url)
endfunction
