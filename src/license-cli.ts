import boxen from "boxen";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import prompt, { Choice, PromptObject } from "prompts";

const readPackageJson = (
  location = "./package.json",
  property?: string
): Object => {
  const packageJson = fs.readFileSync(location, "utf8");
  const parsed = JSON.parse(packageJson);
  if (property) return parsed[property];
  return parsed;
};

type LicenseType =
  | "unlicense"
  | "mit"
  | "wtfpl"
  | "gpl-3.0"
  | "apache-2.0"
  | "bsd-2-clause"
  | "bsd-3-clause"
  | "cc0-1.0"
  | "epl-2.0"
  | "free-art-1.3"
  | "gpl-2.0"
  | "gpl-3.0"
  | "isc"
  | "lgpl-2.1"
  | "lgpl-3.0"
  | "mpl-2.0";
const licenses: Choice[] = [
  {
    title: "unlicense",
    value: "unlicense",
    description: "The Unlicense",
  },
  {
    title: "mit",
    value: "mit",
    description: "MIT License",
  },
  {
    title: "wtfpl",
    value: "wtfpl",
    description: "Do What The Fuck You Want To Public License",
  },
  {
    title: "gpl-3.0",
    description: "GNU Affero General Public License v3.0",
    value: "agpl-3.l",
  },
  {
    title: "apache-2.0",
    value: "apache-2.0",
    description: "Apache License 2.0",
  },
  {
    title: "bsd-2-clause",
    value: "bsd-2-clause",
    description: 'BSD 2-Clause "Simplified" License',
  },
  {
    title: "bsd-3-clause",
    value: "bsd-3-clause",
    description: 'BSD 3-Clause "New" or "Revised" License',
  },
  {
    title: "cc0-1.0",
    value: "cc0-1.0",
    description: "Creative Commons Zero v1.0 Universal",
  },
  {
    title: "epl-2.0",
    value: "epl-2.0",
    description: "Eclipse Public License 2.0",
  },
  {
    title: "free-art-1.3",
    value: "free-art-1.3",
    description: "Free Art License 1.3",
  },
  {
    title: "gpl-2.0",
    value: "gpl-2.0",
    description: "GNU General Public License v2.0",
  },
  {
    title: "gpl-3.0",
    value: "gpl-3.0",
    description: "GNU General Public License v3.0",
  },
  {
    title: "isc",
    value: "isc",
    description: "ISC License",
  },
  {
    title: "lgpl-2.1",
    value: "lgpl-2.1",
    description: "GNU Lesser General Public License v2.1",
  },
  {
    title: "lgpl-3.0",
    value: "lgpl-3.0",
    description: "GNU Lesser General Public License v3.0",
  },
  {
    title: "mpl-2.0",
    value: "mpl-2.0",
    description: "Mozilla Public License 2.0",
  },
];

(async function () {
  const packageJson = readPackageJson();
  const initialLicenseIdx = licenses.findIndex(
    (license) => license.title === packageJson?.["license"]?.toLowerCase()
  );
  const initialLicense =
    packageJson["license"] &&
    (licenses.find(
      (license) => license.title === packageJson?.["license"]?.toLowerCase()
    ).value as LicenseType);
  const packageJsonAuthor = packageJson["author"];
  let initialAuthor =
    typeof packageJsonAuthor === "string"
      ? packageJsonAuthor
      : typeof packageJsonAuthor === "object"
      ? packageJson["author"]["name"]
      : "";

  const promptLicense: PromptObject<"license"> = {
    type: "select",
    name: "license",
    message: "Pick a license",
    choices: licenses,
    initial:
      licenses.findIndex(
        (license) => license.title === packageJson?.["license"]?.toLowerCase()
      ) >= 0
        ? initialLicenseIdx
        : 0,
  };

  const promptAuthor: PromptObject<"name"> = {
    type: "text",
    name: "name",
    message: "What is your name?",
    initial: initialAuthor,
  };

  const promptYear: PromptObject<"year"> = {
    type: "number",
    name: "year",
    message: `License Year?`,
    initial: new Date().getFullYear(),
    validate: (date) =>
      date > Date.now() ? `Year can't be in the future` : true,
  };
  const promptFileName: PromptObject<"fileName"> = {
    type: "select",
    name: "fileName",
    message: `What's your extension?`,
    initial: 0,
    choices: [
      {
        title: "LICENSE",
        value: "LICENSE",
        description: "No file extension..  (LICENSE)",
      },
      {
        title: "LICENSE.md",
        value: "LICENSE.md",
        description: "Markdown File",
      },
      {
        title: "LICENSE.txt",
        value: "LICENSE.txt",
        description: "Text File",
      },
    ],
  };

  const promptPath: PromptObject<"path"> = {
    type: "text",
    name: "path",
    message: "Where do you want to save the file?",
    initial: "./",
    validate: (path) => {
      if (!fs.existsSync(path)) {
        return "Path does not exist";
      }
      return true;
    },
  };

  let questions = [promptAuthor, promptYear, promptFileName, promptPath];

  if (initialLicenseIdx > 0) questions.push(promptLicense as PromptObject<any>);

  const response = await prompt(questions, {
    onCancel: cleanup,
    onSubmit: (values) => {
      // console.log(values);
    },
  });
  const answers = { license: initialLicense as LicenseType, ...response };

  const template = applyLicenseTemplate(answers.license, answers);
  updatePackageJson(answers.license);

  if (typeof template === "string")
    await writeLicense(answers, template).then((f) => {
      console.log(chalk.gray("File saved to: ") + chalk.yellow(f.fullPath));
      console.log(
        chalk.green(
          boxen(`Created ${answers.license.toUpperCase()} license`, {
            padding: 1,
            borderStyle: "round",
            margin: 1,
          })
        )
      );
    });
})();

const updatePackageJson = (license: LicenseType) => {
  let packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  packageJson.license = license;
  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
};

const writeLicense = async (
  answers: prompt.Answers<"fileName" | "path" | "license" | "name" | "year">,
  template: string
) => {
  const fullPath = path.resolve(path.join(answers.path, answers.fileName));
  fs.writeFileSync(fullPath, template);
  return { ...answers, fullPath };
};

const applyLicenseTemplate = (
  license: LicenseType,

  opts: prompt.Answers<"license" | "name" | "year" | "fileName" | "path">
) => {
  try {
    return fs
      .readFileSync(
        path.resolve(path.join("templates", `${license}.tmpl`)),
        "utf8"
      )
      .replace("{{.Name}}", opts.name)
      .replace("{{.Year}}", opts.year);
  } catch (error) {
    console.error(error);
  }
};

function cleanup() {}
