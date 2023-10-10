# Jira API Helper Scripts

## create_tickets.py

### Overview

This script was created with the following goal in mind: automatically create tickets in JIRA accurately depicting the dependency updates we would like to work on in a sprint. 
As work progressed we refined the goal into the following steps (note that these are specific to PIMS desired outcomes for this work):
1. Gather list of dependency updates
    - This list should only include minor and major updates
    - This list should only include current update information 
2. Gather list of dependency update tickets from JIRA 
    - This list should contain only necessary information
3. Remove items that appear on both lists
4. Create tickets in PIMS backlog in JIRA

### Service Account

To not have this process dependent on a personal account we are using a service account to generate a JIRA API Key (more information below.) 
This account's password needs to be updated every 90 days. That can be done using the following process: 
STEPS GO HERE

### Jira API key 

More information on Jira API keys here: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/

The generated key was then stored in GitHub secrets so that it can be utilized as an environment variable.
More information on Github secrets and how to use them here: https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions

### Dependency In

This value is used as the source of dependencies that need to be updated. This is specific to the formatting found in the issues created in the PIMS repo. See: https://github.com/bcgov/PIMS/issues/1772 as an example. 

### Project Key

Signifies what board in JIRA to post to within the IMB space. 
Example: PIMS
### Level Flags

String that holds the key words of dependencies we would like to update. Any arrangement of the following will be accepted and read: 

- PATCH
- MINOR
- MAJOR

If something other than the above is entered it will not be processed. Each key word should be seperated by a space.


## Other scripts in this space

### jira_con.py

Used to connect to JIRA and to pull existing tickets

### refine_dependency.py

Used for refining strings and lists from existing tickets and dependency lists. 

### refine_tickets.py

Used for finalizing the ticket API format for the parent and sub task tickets. 

### errors.py

Used for creating our own error class for handlind undesired API responses. 
