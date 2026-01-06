# Team Guide: Cloning the Repository & Branching Workflow

This guide explains how to clone the project, create branches, stay up to date with `main`, and contribute using pull requests.  
Follow these steps to ensure a smooth, conflict‑free workflow for the whole team.

---

## 1. Cloning the Repository

> [!IMPORTANT]
> You only need to clone the repo ONCE.
> This will create the repository on your local machine.


### HTTPS
1. Chose where you want the git project to live (e.g. C:\Users\markr\Documents\vscode-projects)
2. In a Visual Studio Code terminal, navigate to the location you have chosen;
---
    cd C:\Users\markr\Documents\vscode-projects

3. In the Visual Studio Code terminal, clone the repository onto your local machine;
---
    git clone https://github.com/mrosevere/hackathon-elemental-game.git

4. After cloning, browse to the project folder and open it in Visual Studio Code (it may automatically open for you)



## 2. Keeping Your Local Main Branch Up to Date

Before starting any new work:

    git checkout main
    git pull origin main

This ensures your work starts from the most recent version of the project.

---

## 3. Creating a Feature Branch

We use the naming convention:

    <git-project-issue-number>-<your-name>

Examples:

    issue-1-mark
    issue-2-abs

The issue number is the auto number assigned to the issue in the Git Project board:

![screenshot of the project board highlighting where the issue number is displayed](../images/doc-images/project-board-image.png)



To create your branch:

    git checkout -b <issue-number>-<your-name>

---

## 4. Making Changes, Committing, and Pushing

After editing files:

### Stage your changes

    git add .

### Commit with a meaningful message

    git commit -m "Add fire element logic"

### Push your branch to GitHub

    git push -u origin <issue-number>-<your-name>

---

## 5. Opening a Pull Request (PR)

1. Go to the GitHub repository  
2. Click "Compare & pull request"  
3. Fill in the PR template  
4. Ensure the PR title and description match the Issue  
5. Submit the PR for review  

---

## 6. Linking Your PR to an Issue

In the PR description, add:

    Closes #<issue-number>

Example:

    Closes #12

This automatically links the PR to the Issue and closes it when merged.

---

## 7. Getting Your PR Reviewed and Merged

- A teammate reviews your PR  
- Once approved, it can be merged into `main`  
- After merging, delete your branch (GitHub will offer a button)

---

## 8. Starting New Work After a Merge

Always:

    git checkout main
    git pull origin main
    git checkout -b feature/<your-name>/<new-task>

This keeps your workflow clean and conflict‑free.

---

## 9. Optional: Add Screenshots

You can enhance this guide with screenshots of:

- The GitHub “Clone” button  
- The “Compare & pull request” banner  
- The PR template  
- The Issue linking section  
- The Project Board automation  

---

## Acceptance Criteria

- Team members can successfully clone the repository  
- Team members can create correctly named feature branches  
- Team members understand how to keep their branches up to date with `main`  
- Team members can commit and push changes without errors  
- Team members can open PRs and request reviews  
- Instructions are clear, accessible, and stored in the repo  
- The guide supports a consistent workflow across the team  
