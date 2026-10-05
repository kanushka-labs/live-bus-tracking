// Shared pagination-link helper for every collection GET (buses, devices,
// routes) per openapi-conventions: an envelope with relative next/previous
// URIs, computed from limit/offset/total rather than stored anywhere.

function buildPageLinks(string basePath, int 'limit, int offset, int total) returns [string?, string?] {
    string? next = ();
    if offset + 'limit < total {
        next = string `${basePath}?limit=${'limit}&offset=${offset + 'limit}`;
    }
    string? previous = ();
    if offset > 0 {
        int prevOffset = offset - 'limit;
        if prevOffset < 0 {
            prevOffset = 0;
        }
        previous = string `${basePath}?limit=${'limit}&offset=${prevOffset}`;
    }
    return [next, previous];
}
