export default interface NagiosStatusInfo {
  created: number;
  version: string;
  last_update_check: number;
  update_available: boolean;
  last_version: string;
  new_version: string;
}

// Consumes lines from the status_file until the info block has been parsed
export async function parse_info_block(
  rl: AsyncIterableIterator<string>
): Promise<NagiosStatusInfo> {
  const info: NagiosStatusInfo = {
    created: 0,
    version: '',
    last_update_check: 0,
    update_available: false,
    last_version: '',
    new_version: '',
  };
  // Manually iterates through the line iterator
  let result = await rl.next();
  while (!result.done) {
    const line = result.value.trim();
    // The block has finished being parsed
    if (line === '}') {
      return info;
    }
    // Handles key=value pairs
    else if (line.startsWith('created=')) {
      info.created = Number.parseInt(line.split('created=')[1]);
    } else if (line.startsWith('version=')) {
      info.version = line.split('version=')[1];
    } else if (line.startsWith('last_update_check=')) {
      info.last_update_check = Number.parseInt(
        line.split('last_update_check=')[1]
      );
    } else if (line.startsWith('update_available=')) {
      info.update_available = line.split('update_available=')[1] == '1';
    } else if (line.startsWith('last_version=')) {
      info.last_version = line.split('last_version=')[1];
    } else if (line.startsWith('new_version=')) {
      info.new_version = line.split('new_version=')[1];
    }
    result = await rl.next();
  }
  return info;
}
