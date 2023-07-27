" Functions to request denops functions
" They may simplify to get response

function ddu#kind#github#request#patch_body(bufnr, url) abort
  call denops#request_async( 
        \ "ddu-source-github",
        \ "github:patch_body", 
        \ [ a:bufnr, a:url ],
        \ { result ->  s:success(result) },
        \ { error ->  s:failure(error) },
        \ )
  setlocal nomodified
endfunction

function s:success(result)
  echomsg "Modified: " .. a:result
endfunction

function s:failure(error)
  echoerr "Failed to write: " .. a:error
endfunction
