# replicache-express

This is a generic Replicache backend built on Express.

It's "generic" in the sense that it works with any Replicache mutators, and doesn't require app-specific code to sync. It is also agnostic to what frontend framework you use.

## Usage

See https://github.com/rocicorp/replicache-examples for example usage.

This isn't very extensible yet. For example, there are no integration points for authentication, authorization, custom database schema,etc.

We imagine over time, and with experience it will start to be clear what the extension points should be.

For now, if you'd like to add features to this the best way is probably to fork it.

## Contributing

PRs and feature requests are welcome!
