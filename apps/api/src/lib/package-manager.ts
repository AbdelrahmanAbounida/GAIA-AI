import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

export interface DependencyInfo {
  name: string;
  version?: string;
  installed: boolean;
  globallyInstalled: boolean;
}

export class PackageManager {
  private packageManager: "npm" | "pnpm" | "yarn";
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.packageManager = this.detectPackageManager();
  }

  /**
   * Detect which package manager is being used
   */
  private detectPackageManager(): "npm" | "pnpm" | "yarn" {
    try {
      const lockFiles = {
        "pnpm-lock.yaml": "pnpm" as const,
        "yarn.lock": "yarn" as const,
        "package-lock.json": "npm" as const,
      };

      for (const [file, manager] of Object.entries(lockFiles)) {
        const filePath = path.join(this.projectRoot, file);
        if (require("fs").existsSync(filePath)) {
          return manager;
        }
      }
    } catch (error) {
      console.warn("Could not detect package manager, defaulting to npm");
    }
    return "npm";
  }

  /**
   * Check if a package is installed locally
   */
  async isPackageInstalled(packageName: string): Promise<boolean> {
    try {
      const packageJsonPath = path.join(this.projectRoot, "package.json");
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf-8")
      );

      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      return packageName in deps;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a package is installed globally
   */
  async isPackageInstalledGlobally(packageName: string): Promise<boolean> {
    try {
      const command =
        this.packageManager === "npm"
          ? "npm list -g --depth=0 --json"
          : this.packageManager === "pnpm"
            ? "pnpm list -g --depth=0 --json"
            : "yarn global list --json";

      const { stdout } = await execAsync(command);
      const parsed = JSON.parse(stdout);

      if (this.packageManager === "npm" || this.packageManager === "pnpm") {
        return packageName in (parsed.dependencies || {});
      } else {
        // Yarn format is different
        return parsed.data.trees.some((tree: any) =>
          tree.name.startsWith(packageName)
        );
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get dependency information for multiple packages
   */
  async getDependenciesInfo(packages: string[]): Promise<DependencyInfo[]> {
    const results = await Promise.all(
      packages.map(async (pkg) => {
        const [installed, globallyInstalled] = await Promise.all([
          this.isPackageInstalled(pkg),
          this.isPackageInstalledGlobally(pkg),
        ]);

        return {
          name: pkg,
          installed,
          globallyInstalled,
        };
      })
    );

    return results;
  }

  /**
   * Install packages
   */
  async installPackages(
    packages: string[],
    options?: {
      dev?: boolean;
      global?: boolean;
      exact?: boolean;
    }
  ): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const flags = [];

      if (options?.dev) {
        flags.push(this.packageManager === "npm" ? "--save-dev" : "-D");
      }

      if (options?.global) {
        flags.push("-g");
      }

      if (options?.exact) {
        flags.push(this.packageManager === "npm" ? "--save-exact" : "--exact");
      }

      const command = `${this.packageManager} ${options?.global ? "" : "install"} ${packages.join(" ")} ${flags.join(" ")}`;

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectRoot,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      return {
        success: true,
        output: stdout || stderr,
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || "",
        error: error.message,
      };
    }
  }

  /**
   * Uninstall packages (only if not used elsewhere)
   */
  async uninstallPackages(
    packages: string[],
    checkUsage: (pkg: string) => Promise<boolean>
  ): Promise<{ success: boolean; removed: string[]; skipped: string[] }> {
    const removed: string[] = [];
    const skipped: string[] = [];

    for (const pkg of packages) {
      const isUsed = await checkUsage(pkg);

      if (isUsed) {
        skipped.push(pkg);
        continue;
      }

      try {
        const command = `${this.packageManager} uninstall ${pkg}`;
        await execAsync(command, { cwd: this.projectRoot });
        removed.push(pkg);
      } catch (error) {
        console.error(`Failed to uninstall ${pkg}:`, error);
        skipped.push(pkg);
      }
    }

    return {
      success: removed.length > 0,
      removed,
      skipped,
    };
  }

  /**
   * Validate if packages exist in npm registry
   */
  async validatePackages(packages: string[]): Promise<{
    valid: string[];
    invalid: string[];
  }> {
    const results = await Promise.all(
      packages.map(async (pkg) => {
        try {
          const command = `npm view ${pkg} version`;
          await execAsync(command);
          return { package: pkg, valid: true };
        } catch (error) {
          return { package: pkg, valid: false };
        }
      })
    );

    return {
      valid: results.filter((r) => r.valid).map((r) => r.package),
      invalid: results.filter((r) => !r.valid).map((r) => r.package),
    };
  }

  /**
   * Get the install command as a string (for display purposes)
   */
  getInstallCommand(packages: string[], options?: { dev?: boolean }): string {
    const flags = options?.dev
      ? this.packageManager === "npm"
        ? "--save-dev"
        : "-D"
      : "";

    return `${this.packageManager} install ${packages.join(" ")} ${flags}`.trim();
  }
}

// Singleton instance
let packageManagerInstance: PackageManager | null = null;

export function getPackageManager(projectRoot?: string): PackageManager {
  if (!packageManagerInstance || projectRoot) {
    packageManagerInstance = new PackageManager(projectRoot);
  }
  return packageManagerInstance;
}
