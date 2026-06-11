export const IPC = {
  AuthGetState: 'auth:get-state',
  AuthLogin: 'auth:login',
  AuthLogout: 'auth:logout',
  PlaylistFetch: 'playlist:fetch',
  PlaylistFetchProgress: 'playlist:fetch-progress',
  CloneStart: 'clone:start',
  CloneCancel: 'clone:cancel',
  CloneProgress: 'clone:progress',
  OpenExternal: 'shell:open-external'
} as const
