import { Command } from "commander";
import pc from "picocolors";
import { addSkill, analyzeProject, doctorWorkspace, initWorkspace, loadCatalog, validateCatalog } from "./commands.js";

function stackLines(project: Awaited<ReturnType<typeof analyzeProject>>): string[] {
  return project.facts.map((fact) => `${fact.value} ${pc.dim(`(${fact.source})`)}`);
}

export function createProgram(): Command {
  const program = new Command();
  program.name("agent-workspace").description("Give your coding agent a team, not another prompt.").version("0.1.0").showHelpAfterError();

  program.command("init")
    .argument("[path]", "repository to initialize", ".")
    .option("--tools <names>", "comma-separated adapters or all", "all")
    .option("--force", "overwrite conflicting files")
    .option("--dry-run", "show what would change without writing")
    .option("--json", "print machine-readable output")
    .description("analyze a repository and create its AI engineering workspace")
    .action(async (target, options) => {
      const result = await initWorkspace(target, options);
      if (options.json) return console.log(JSON.stringify(result, null, 2));
      console.log(`\n${pc.bold("Detected stack")}\n`);
      const lines = stackLines(result.project);
      console.log(lines.length ? lines.join("\n") : pc.dim("No supported stack markers detected."));
      console.log(`\n${pc.bold("Creating your AI engineering team...")}\n`);
      for (const role of ["Architect", "Implementation Engineer", "Reviewer", "Test Engineer", "Debugger", "Security Reviewer"]) console.log(`${pc.green("✓")} ${role}`);
      console.log(`\n${pc.green("✓")} ${result.write.created.length} files created${result.write.updated.length ? `, ${result.write.updated.length} updated` : ""}`);
      if (result.write.skipped.length) console.log(`${pc.yellow("!")} ${result.write.skipped.length} existing files preserved: ${result.write.skipped.join(", ")}`);
      console.log(`${pc.bold(`Context coverage: ${result.score}/100`)}\n`);
      console.log(options.dryRun ? pc.yellow("Dry run complete; nothing was written.\n") : `${pc.bold("Your AI engineering workspace is ready.")}\n`);
    });

  program.command("analyze")
    .argument("[path]", "repository to inspect", ".")
    .option("--json", "print machine-readable output")
    .description("inspect a repository without writing files")
    .action(async (target, options) => {
      const project = await analyzeProject(target);
      if (options.json) return console.log(JSON.stringify(project, null, 2));
      console.log(`\n${pc.bold(project.name)}\n`);
      console.log(stackLines(project).join("\n") || pc.dim("No supported stack markers detected."));
      if (project.commands.length) console.log(`\n${pc.bold("Commands")}\n${project.commands.map((item) => `${item.name}: ${item.command}`).join("\n")}`);
      console.log();
    });

  program.command("add")
    .argument("<skill>", "bundled skill name")
    .argument("[path]", "initialized repository", ".")
    .description("add a skill to an existing workspace")
    .action(async (skill, target) => {
      const result = await addSkill(target, skill);
      console.log(result === "added" ? `${pc.green("✓")} Added ${skill}` : `${pc.dim("•")} ${skill} is already installed`);
    });

  program.command("list")
    .description("list bundled agents and skills")
    .action(async () => {
      const catalog = await loadCatalog();
      console.log(`\n${pc.bold("Agents")}\n`);
      catalog.agents.forEach((item) => console.log(`${pc.cyan(item.name.padEnd(24))} ${item.description}`));
      console.log(`\n${pc.bold("Skills")}\n`);
      catalog.skills.forEach((item) => console.log(`${pc.cyan(item.name.padEnd(24))} ${item.description}`));
      console.log();
    });

  program.command("doctor")
    .argument("[path]", "initialized repository", ".")
    .option("--json", "print machine-readable output")
    .description("check workspace integrity and readiness")
    .action(async (target, options) => {
      const result = await doctorWorkspace(target);
      if (options.json) return console.log(JSON.stringify(result, null, 2));
      result.passed.forEach((item) => console.log(`${pc.green("✓")} ${item}`));
      result.failed.forEach((item) => console.log(`${pc.red("✗")} ${item}`));
      console.log(`\n${pc.bold(`Workspace health: ${result.score}/100`)}\n`);
      if (result.failed.length) process.exitCode = 1;
    });

  program.command("validate")
    .argument("[path]", "agent-workspace repository", ".")
    .description("validate extension schemas and catalog integrity")
    .action(async (target) => {
      const result = await validateCatalog(target);
      console.log(`${pc.green("✓")} Validated ${result.agents} agents and ${result.skills} skills`);
    });

  return program;
}

export async function run(argv = process.argv): Promise<void> {
  await createProgram().parseAsync(argv);
}

if (process.env.NODE_ENV !== "test") run().catch((error: unknown) => {
  console.error(pc.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
  process.exitCode = 1;
});
