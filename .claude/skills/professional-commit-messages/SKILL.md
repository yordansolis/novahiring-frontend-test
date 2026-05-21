---
name: professional-commit-messages
description: Write clear, professional, and maintainable commit messages. Use when creating commits for any code change, fix, feature, or refactor.
---

When writing commit messages, always follow these rules:

1. **Use a clear structure (Conventional Commits)**  
   Format:
   ```
   <type>(optional-scope): short summary
   ```

   Examples:
   - feat(auth): add JWT authentication
   - fix(api): handle null response in user endpoint
   - refactor(db): optimize query performance

2. **Keep the summary concise and meaningful**  
   - Max ~50 characters
   - Use present tense (e.g., "add", "fix", not "added", "fixed")
   - Describe *what* changed, not how

   Good:
   - fix(login): validate empty password field  
   Bad:
   - fixed stuff
   - changes

3. **Use a descriptive body when needed**  
   Explain *why* the change was made and any important context.

   Structure:
   - What was the problem?
   - What was done?
   - Why this approach?

   Example:

   ```
   fix(payment): prevent duplicate transactions

   Users were able to submit the payment form multiple times,
   causing duplicate charges.

   Added a request lock mechanism and disabled the submit button
   after the first click.
   ```

4. **Use standard commit types**  
   - feat: new feature  
   - fix: bug fix  
   - refactor: code improvement without behavior change  
   - perf: performance improvement  
   - docs: documentation changes  
   - style: formatting (no logic changes)  
   - test: adding or updating tests  
   - chore: maintenance tasks  

5. **Reference issues or tickets (if applicable)**  
   Use IDs from Jira, GitHub, etc.

   Example:
   ```
   feat(cart): add discount calculation

   Implements discount logic based on user tier.

   Closes #123
   ```

6. **Be specific, avoid vague language**  
   Bad:
   - update code  
   - fix bug  
   - improvements  

   Good:
   - fix(cache): resolve stale data issue in Redis  
   - perf(api): reduce response time by optimizing queries  

7. **Write for your future self and team**  
   - Someone should understand the change months later  
   - Avoid internal slang or unclear abbreviations  

8. **One commit = one logical change**  
   - Do not mix unrelated changes in a single commit  

   Bad:
   - fix login + update UI + refactor DB  

   Good:
   - fix(auth): handle invalid credentials  
   - style(ui): improve login form layout  
   - refactor(db): normalize user table  

9. **Use imperative tone**  
   Think: "This commit will..."

   Correct:
   - add validation to email field  
   - remove unused variables  

10. **Avoid unnecessary noise**  
    - Do not include logs, temporary notes, or irrelevant details  

---

### Example of a professional commit

```
feat(notification): add email notification service

Implemented a new email notification system to alert users
about account activity.

- Integrated SMTP service
- Added retry mechanism for failed emails
- Created notification templates

This improves user engagement and system reliability.

Closes #456
```
