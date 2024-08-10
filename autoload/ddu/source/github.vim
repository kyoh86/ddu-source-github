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
  echoerr "Failed to write: " .. a:error
endfunction

function ddu#source#github#login(...) abort
  return denops#request(
        \ "ddu-source-github",
        \ "login", 
        \ a:000,
        \ )
endfunction

function ddu#source#github#ensure_login(...) abort
  call denops#request_async( 
        \ "ddu-source-github",
        \ "ensure_login", 
        \ a:000,
        \ { result -> s:ensure_login_success(result) },
        \ { error -> s:ensure_login_failure(error) },
        \ )
  setlocal nomodified
endfunction

function s:ensure_login_success(result)
  echomsg "Ensured login session: " .. a:result
endfunction

function s:ensure_login_failure(error)
  echoerr "Failed to ensure login session: " .. a:error
endfunction

