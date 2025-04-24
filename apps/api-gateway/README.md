# 🐱 Nestjs

## Installation

If you haven't already, install the [Bun CLI](https://bun.sh/).

```sh
curl -fsSL https://bun.sh/install | bash
# or to upgrade an existing installation
bun upgrade
```

After cloning the repository, install the necessary dependencies by running:

```sh
bun install
```

To start the `plagiarism-service`, run the following command:

> Install `just` if you haven't already:
> https://github.com/casey/just

```sh
just install-tools
```

You can start your local database by running:

```sh
cp .env.template .env
docker compose up -d
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
