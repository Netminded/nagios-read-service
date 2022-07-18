# Nagios Read Component

A read only nagios service which generates feeds from nagios status information

## Service/Hosts -> Feeds

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

3.  A 'diagnostic' feed, a simple "Is the service running?" feed

All services defined in nagios can be exposed as these feeds.
Which services get exposed gets defined in the config file

## The config file
You need to tell the service where the config file can be found, this can be done with the `-c` or `--config` cli 
flag. If the flag isn't provided, then the service looks for the config file 
at `/etc/netminded/nagios-read-service/config.toml`.

The config file format is toml.

### Global options

 - `nagios_config_file_path`: The full path (or relative to the current working directory) to the nagios config file, 
defaults to `/usr/local/nagios/etc/nagios.etc`.
 - `poll_cron`: The cron determining how often nagios should be polled for the status of objects. 
This has no default, a reasonable rate would be `* * * * *`, i.e. every minute. 
A useful tool for this is https://crontab.guru/
 - `batch_size`: Feed result upserts (uploads) to the dashboard are batched, i.e. the service will accumulate 
evaluated feeds, and submit them all at once. This parameter determines how many feeds to batch together before upserting.
This defaults to 25 feeds.

### Exposure blocks
Every service/host gets a set of feeds that it can 'expose', i.e. feeds that the service/host can evaluate to. 
By default, no service/host exposes a feed (i.e. no service/host maps to a feed). And so the set of feeds that get 
exposed by services/hosts needs to be defined in the config file. 

Rather than defining each feed that a service/host exposes individually, there is this concept of an 'exposure block'.
In an 'exposure block' you:

 1. Select a set of services/hosts, and
 2. Define the feeds that all the services/hosts selected will expose

And so, rather than defining feeds individually, you define lots at the same time.

Here is how it is done:
```toml
# Defines a **service** exposure block, you can have many of these
[[exposures.services]]
    # The 'match' part defines which nagios services this exposure block applies to
    # Any service that matches ALL of the following regexes will become a part of this exposure block
    # i.e. Only services that have a service_description that matches the service_description regex becomes a part of this block.
    # Each field can be ommited as well, so if you only want the block to apply to services that have a particular description,
    # then youo can ommit the command field. If all fields are ommited, then this block applies to no services.
    [exposures.services.match]
    service_description = "<Some Regex>"  # This regex is checked against the service's `service_description` field
    command = "<Some Regex>"  # This regex is checked against the service's `check_command` field

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
```

### Example
```toml
nagios_config_file_path = "./examples/nagios/nagios.cfg"
poll_cron = "* * * * *"
batch_size = 50

# Will expose the diagnostics feeds of services
[[exposures.services]]
    # This block applies to any services that match the conditions
    [exposures.services.match]
    service_description = ".*"

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
    # This block applies to any services that is specifically named 'PING'
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
```


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

### Download

 1. You first need to download the latest release, TODO (Link)
    1. With curl
    2. With wget
 2. Unzip the directory
 3. Once in the directory, you need to install the dependencies `npm install --production`

At this point, the component is ready to run with `npm run start`. 
However, for running in production, see [Running](#running-1) 

## Running

### systemd (Preferred)



### Docker

### PM2
