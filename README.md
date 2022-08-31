# Nagios Read Component

A read only nagios service which generates feeds from nagios status information

## Service/Hosts -> Feeds

### Services

Every service defined in a nagios instance can be exposed as 3 feeds:

1.  A 'transparent' feed, which is a simple mapping of

    1. `state_ok` -> `green`
    2. `state_warning` -> `amber`
    3. `state_critical` -> `red`
    4. `state_unknown` -> `default`

    And plugin_output -> `message`. It is a simple feed,
    however, it is the easiest way to expose nagios' status decision as a feed.

2.  A 'plugin' feed. Each nagios service relies on a 'plugin' to run,
    this plugin provides both a status and a string output to nagios,
    which these types of feeds use to interpret a feed result.

    For each plugin, a specific feed interpretation will have to be designed,
    but once it exists, a service that uses the plugin, can have the respective feed

[//]: # (3.  A 'diagnostic' feed, a simple "Is the service running?" feed)

All services defined in nagios can be exposed as these feeds.
Which services get exposed gets defined in the config file

### Hosts

Every host can be exposed as a 'status' feed, which is essentially the host 'version' of the service transparent feed.

## The config file

You need to tell the service where the config file can be found, this can be done with the `-c` or `--config` cli
flag. If the flag isn't provided, then the service looks for the config file
at `/etc/netminded/nagios-read-service/config.toml`.

The config file format is toml.

### Interpolation

Some strings support interpolation, that is, dynamic insertion of another string into the string being interpolated.

Not all strings support it, and whey they do, it will be made clear.

#### Regex

Regex interpolation is replacing parts of a string with named values found from a regex match.

Any block of `{{ NAME }}` in a string (that supports Regex interpolation) will be replaced with the
regex group named `NAME`, in some places though extra values, not specifically named in the regex, may be available for
interpolation

e.g. `Service named '{{ SERVICE_NAME }}' feed'` would interpolate to `Service named 'PING' feed`

#### Env

Env interpolation is replacing parts of a string with values defined in the environment variables.

Any block of `{! ENV_VAR_NAME !}` in a string (that support Env interpolation) will be replaced with the
environment variable with the name `ENV_VAR_NAME`.

e.g. `The localisation of the terminal session is {! LC_ALL !}, and the PWD is '{! PWD !}'`
would interpolate to `The localisation of the terminal session is en_GB.UTF-8, and the PWD is '/etc/netminded/nagios-read-service'`

### Global options

- `nagios_config_file_path`: The full path (or relative to the current working directory) to the nagios config file,
  defaults to `/usr/local/nagios/etc/nagios.etc`.

**Important** The nagios config file is parsed for the location of both the object cache and status files.
This service will then try reading from the files as if they're on the host machine. And so, if nagios is running in
a container, then the full path to those files should be mapped to the host machine. i.e. If the files are in
`/usr/local/nagios` in the nagios container, then they should be mapped to `/usr/local/nagios` on the host machine.

- `poll_cron`: The cron determining how often nagios should be polled for the status of objects.
  This has no default, a reasonable rate would be `* * * * *`, i.e. every minute.
  A useful tool to determine the cron is https://crontab.guru/
- `batch_size`: Feed result upserts (uploads) to the dashboard are batched, i.e. the service will accumulate
  evaluated feeds, and submit them all at once. This parameter determines how many feeds to batch together before upserting.
  This defaults to 25 feeds.

### Api

The service needs to be able to upsert to the dashboard, but by default, it has no knowledge of where to upsert and what
authentication to use.

To provide these details, you need to provide an `api` table with the following parameters

- `upsert_endpoint`: A string containing the **full** url to the upsert endpoint, as of now, this value should be set
  to https://api.seethrunetworks.com/api/v3/feed-service/feed/upsert
- `jwt_key_refresh_endpoint`: If you're using JWT based authentication for the api, the service needs to know where to
  refresh tokens. This string should contain the **full** url to the JWT token refresh endpoint, as of now, this value
  should be set to https://api.seethrunetworks.com/api/token

#### Keys

The apis require authentication to upsert feed results.
These authentication mechanisms are abstracted as 'keys' in this service.
There can be many keys, which allows different feeds to upsert using different keys.

Each key needs to be named, and a key named 'default' **must** be provided, this is the default key used by feeds.

##### JWT Keys

To define a JWT key, you need to following fields:

- `type = "jwt"`
- `uuid` or `access_token`: A string containing the uuid (access_token), this string supports Env interpolation,
  e.g. `{! JWT_KEY_UUID !}` will take the uuid from the environment variables.
- `secret_key` or `secret`: A string containing the secret key for the JWT, this string supports Env interpolation,
  e.g. `{! JWT_KEY_SECRET !}` will take the secret key from the environment variables.

### Exposure blocks

Every service/host gets a set of feeds that it can 'expose', i.e. feeds that the service/host can evaluate to.
By default, no service/host exposes a feed (i.e. no service/host maps to a feed). And so the set of feeds that get
exposed by services/hosts needs to be defined in the config file.

Rather than defining each feed that a service/host exposes individually, there is this concept of an 'exposure block'.
In an 'exposure block' you:

1.  Select a set of services/hosts, and
2.  Define the feeds that all the services/hosts selected will expose

And so, rather than defining feeds individually, you define lots at the same time.

Here is how it is done:

```toml
# Defines a **service** exposure block, you can have many of these
[[exposures.services]]
    # The 'match' part defines which nagios services this exposure block applies to
    # Any service that matches ALL of the following regexes will become a part of this exposure block
    # i.e. Only services that have a service_description that matches the service_description regex becomes a part of this block.
    # Each field can be ommited as well, so if you only want the block to apply to services that have a particular description,
    # then you can ommit the command field. If all fields are ommited, then this block applies to no services.
    [exposures.services.match]
    host_name = "<Soome Regex>"  # This regex is checked against the service's `host_name` field
    service_description = "<Some Regex>"  # This regex is checked against the service's `service_description` field
    check_command = "<Some Regex>"  # This regex is checked against the service's `check_command` field

    # This block defines the `diagnostic.is_running` feed for all services that are a part of this exposure block
    [exposures.services.feeds.diagnostic.is_running]
    # Defines where the feed should show up on the dashboard
    organisation = { id = 1 }
    page = { id = 10 }
    space = { id = 9 }
    # How should the feed be named? As we are defining many feeds at the same time, the name of the feed has a feature
    # called string interpolation. i.e. The name of this feed for a particular service will be this string but with
    # all `{{ <field> }}` sections replaced with the value that <field> points to.
    # By default, <field> can be any of `host_name`, `service_description`, `check_command`, and/or `display_name`.
    # <fiield> can also be a named group from any of the regexes in the match part
    name = "Diagnostic Feed for {{ service_description }}"
    # Similar to name, however this field defaults to the service's description, and so may be ommitted.
    message = "{{ service_description }}"

    # This block defines the `transparent` feed for all services that are a part of this exposure block
    [exposures.services.feeds.transparent]
    organisation = { id = 1 }
    space = { id = 10 }
    page = { id = 10 }
    name = "Transparent Feed for {{service_description}}"

[[exposures.hosts]]
    # The 'match' part defines which nagios hosts this exposure block applies to
    # Any host that matches ALL of the following regexes will become a part of this exposure block
    # i.e. Only hosts that have a host_name that matches the host_name regex becomes a part of this block.
    # Each field can be ommited as well, so if you only want the block to apply to hosts that have a particular name,
    # then you can ommit the command field. If all fields are ommited, then this block applies to no hosts.
    [exposures.hosts.match]
    host_name = "<Soome Regex>"  # This regex is checked against the host's `host_name` field
    address = "<Some Regex>"  # This regex is checked against the host's `address` field
    check_command = "<Some Regex>"  # This regex is checked against the host's `check_command` field

    # This block defines the `status` feed for all hosts that are a part of this exposure block
    [exposures.hosts.feeds.status]
    # Defines where the feed should show up on the dashboard
    organisation = { id = 1 }
    page = { id = 10 }
    space = { id = 9 }
    # How should the feed be named? As we are defining many feeds at the same time, the name of the feed has a feature
    # called string interpolation. i.e. The name of this feed for a particular service will be this string but with
    # all `{{ <field> }}` sections replaced with the value that <field> points to.
    # By default, <field> can be any of `host_name`. `address`, `check_command`, and `display_name`.
    # <fiield> can also be a named group from any of the regexes in the match part
    name = "Status feed for {{ display_name }}"
    # Similar to name, however this field defaults to '{{ check_command }}' for '{{ host_name }}', and so may be ommitted.
    message = "{{ check_command }}' for '{{ host_name }}"
```

### Example

```toml
nagios_config_file_path = "./examples/nagios/nagios.cfg"
poll_cron = "* * * * *"
batch_size = 50

[api]
upsert_endpoint = "https://api.seethrunetworks.com/api/v3/feed/update"
jwt_key_refresh_endpoint = "https://api.seethrunetworks.com/api/token"

[api.keys.default]
type = "jwt"
secret_key = "{! API_KEY_SECRET_KEY !}"
uuid = "{! API_KEY_UUID !}"

# Will expose the diagnostics feeds of services
[[exposures.services]]
# This block applies to any services that match the conditions
[exposures.services.match]
service_description = "(?<service_description>.*)"

# Defines the diagnostics feed for all services that this block found
[exposures.services.feeds.diagnostic.is_running]
organisation = { id = 1 }
page = { id = 10 }
space = { id = 9 }
name = "Diagnostic Feed for {{service_description}}"

# Defines the transparant feed for all services that this block found
[exposures.services.feeds.transparent]
organisation = { id = 1 }
space = { id = 10 }
page = { id = 10 }
name = "Transparent Feed for {{service_description}}"

# Will expose the ping feed for a service with name PING
[[exposures.services]]
[exposures.services.match]
# This block applies to any services that match the conditions
service_description = "PING"

# Defines the transparent feed for the service with description 'PING'
[exposures.services.feeds.transparent]
organisation = { id = 1 }
page = { id = 10 }
space = { id = 9 }
name = "PING (Transparent)"

# Defines the ping plugin feed for the service with description 'PING'
[exposures.services.feeds.plugin.ping]
organisation = { id = 1 }
page = { id = 10 }
space = { id = 9 }
name = "PING"


[[exposures.hosts]]
[exposures.hosts.match]
host_name = ".*"

[exposures.hosts.feeds.status]
organisation = { id = 1 }
page = { id = 10 }
space = { id = 9 }
name = "Status of '{{host_name}}'"
```

## Tags

Every feed can have tags, these tags can be defined in both nagios itself and in the config file.

### Note

The dashboard identifies tags by a comma, so the tags `linux_kernel=5.19,os=debian,my,list`, would have a tag list
of 

 - `linux_kernel=5.19`
 - `os=debian`
 - `my`
 - `list`

And so it is important that you **do not** use commas in tag values

### In nagios

All nagios objects support [custom variables](https://assets.nagios.com/downloads/nagioscore/docs/nagioscore/3/en/customobjectvars.html).
To summarise, any variable in the config that starts with '\_' is a custom variable, and will show up in the object cache

All custom variables keyed by '_nmtag' will become a netminded tag, you can declare many tags in an object definition,
by using the same key

e.g.

The host definition

    define host {
        use                     linux-server
        host_name               localhost
        alias                   localhost
        address                 127.0.0.1
        _nmtag                  linux_kernel=5.19
        _nmtag                  os debian
    }

Will have the tags `linux_kernel=5.19`, and `os debian`

### In the config file

In the service's config file, when defining a feed, you can provide an extra field containing all the _extra_ tags that
the feed should have, these tags should be provided as a list.
Also, tag values defined in the config file support interpolation (like you would use for the name or description) 

e.g.

    .
    .
    .
    [exposures.hosts.feeds.status]
    organisation = { id = 1 }
    page = { id = 10 }
    space = { id = 9 }
    name = "Status of '{{host_name}}'"
    tags = [ "linux_kernel=5.19", "os=debian", "host={{host_name}}", "{{check_command}}" ]

If the same tag has been defined in both nagios and in the config file, the config file tag takes priority

## Development

This section assumes that you already have a node environment setup

### Install packages

Run `npm install`, this will install both dependencies and development dependencies (which are necessary to build)

### Running

As this is a typescript project, the source code needs to be built before the service can be ran.

#### Build

There are two options for building;

1.  `npm run build`, this will compile `src` into `dist`, the entrypoint being `dist/app.js`
2.  `npm run build:watch`, this is the same as (.1) however, it will watch for changes and automatically compile

#### Starting

To start the service, run `npm run start`

### Testing

This project uses jest for testing, all the tests are in the `__test__` directory.
To run all tests: `npm run test`

### Linting / Formatting

This project uses EsLint for linting and Prettier for formatting.

To lint the project: `npm run lint`

To format the project: `npm run fmt` or `npm run prettier`

## Production Install

### Prerequisites

- A nagios instance, where the absolute path to the status and object catch files should
  be directly available as that path on the host machine
- Node18, this should be installed and made available in the path for the root user as `node` _before_ installation.
  To verify this, `sudo node -v` should return a version along the lines of 18.x

  The version made available in Debian may not be version 18, and so, an alternative way to install it could be through
  the 'node version manager', `nvm`

### Download and Install

An install script has been provided, to run it:

```shell
curl -sSL https://github.com/Netminded/nagios-read-service/releases/download/v1.0.2-beta.1/install.sh | sudo bash
```

After this, you will need to:

1. configure the config file, found at `/etc/netminded/nagios-read-service/config.toml`
   (the env file is found at `/etc/netminded/nagios-read-service/.env`)
2. Start the service, `sudo systemctl start nagios-read-service`

### Manage the service

- To start: `sudo systemctl start nagios-read-service`
- To get the status: `sudo systemctl status nagios-read-service`
- To get logs: `sudo journalctl --follow -u nagios-read-service`
