export const IPC = {
  AuthGetState: 'auth:get-state',
  AuthLogin: 'auth:login',
  AuthLogout: 'auth:logout',
  PlaylistFetch: 'playlist:fetch',
  PlaylistFetchProgress: 'playlist:fetch-progress',
  PlaylistMine: 'playlist:mine',
  CloneStart: 'clone:start',
  CloneCancel: 'clone:cancel',
  CloneProgress: 'clone:progress',
  ExportSave: 'export:save',
  OpenExternal: 'shell:open-external'
} as const
