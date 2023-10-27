# Contributing to bbs-door-runner

Thank you for considering contributing to `bbs-door-runner`. Your help is invaluable. Follow the guidelines below to contribute.

## Getting Started

1. **Fork the Repository**: Fork the `bbs-door-runner` GitHub repository to your own account.

2. **Clone the Repository**: Clone your fork locally.

    ```bash
    git clone https://github.com/YOUR_USERNAME/bbs-door-runner.git
    ```

3. **Set Upstream**: Add the original repository as a remote to sync with.

    ```bash
    git remote add upstream https://github.com/ORIGINAL_OWNER/bbs-door-runner.git
    ```

## Development Process

1. **Branch**: Create a new branch for your feature or fix. Use a descriptive name.

    ```bash
    git checkout -b feature/your_feature_name
    ```

2. **Code**: Make your changes, ensuring they are well-documented and include tests.

3. **Commit**: Commit your changes, following the [Conventional Commits](https://www.conventionalcommits.org/) standard.

    ```bash
    git commit -m "feat: add your feature"
    ```

4. **Sync**: Fetch the latest changes from the upstream repository and rebase your branch.

    ```bash
    git pull --rebase upstream main
    ```

5. **Push**: Push your changes to your fork.

    ```bash
    git push origin feature/your_feature_name
    ```

6. **Pull Request**: Create a pull request from your fork to the original repository.

## Code Standards

- Follow the existing coding style.
- Use meaningful variable names.
- Comment your code where necessary.

## Running Tests

Before submitting a pull request, please run the test suite to ensure your changes don't break existing functionality.

```bash
npm test
```

## Submitting a Pull Request

- Ensure your PR has a clear title and description.
- Link to any related issues.
- Review your own code changes and run tests.

## License

By contributing, you agree that your contributions will be licensed under the project's BSD 2-clause license.
