" Functions to request denops functions
" They may simplify to get response

function ddu#source#github#patch_body(...) abort
  call denops#request_async( 
        \ "ddu-source-github",
        \ "patch_body", 
        \ a:000,
        \ { result -> s:patch_body_success(result) },
        \ { error -> s:patch_body_failure(error) },
        \ )
  setlocal nomodified
endfunction

function s:patch_body_success(result)
  echomsg "Modified: " .. a:result
endfunction

function s:patch_body_failure(error)
  echoerr "Failed to write:\n" .. json_encode(a:error)
endfunction

function ddu#source#github#login(...) abort
  return denops#request(
        \ "ddu-source-github",
        \ "login", 
        \ a:000,
        \ )
endfunction

function ddu#source#github#ensure_login(...) abort
  call denops#notify( 
        \ "ddu-source-github",
        \ "ensure_login", 
        \ a:000,
        \ )
  setlocal nomodified
endfunction
