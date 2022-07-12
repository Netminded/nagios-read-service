export default interface NagiosStatusInfo {
  created: number,
  version: string,
  last_update_check: number,
  update_available: boolean,
  last_version: string,
  new_version: string,
}