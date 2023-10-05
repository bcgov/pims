"""
Modules providing HTTP connections, json formatting,
regex, operating system, and system operations
as well as: 
Modules used to connect to JIRA API, refining dependency updates
and posting tickets.
"""
import http.client
import sys
import os

import jira_con
import refine_dependency
import create_and_post

## **********************************************************************
##
## This script pulls in relevant JIRA tickets and dependency updates
## to create new tickets to cover weekly dependency updates.
##
## It uses the following scripts to do the heavy lifting of the group:
##     - jira_con.py: used for connection to JIRA
##     - refine_dependency: used for refining strings and lists
##     - create_and_post.py: used for creating the tickets to create
##     - errors.py (not used in this script) our own error class to
##         catch bad results from API calls
##
## May want to add the following features in the future
##       Check for similar names like eslint/parser... vs eslint ect
##       Check max results vs. total results in get_summary_list
##       look into not using regex
##
## **********************************************************************

def get_env_variables():
    """
    This method does the work for setting environment variables to be used in
    this script. We will also catch and report any errors as they arise. 
    """
    # check for dependency environment variable
    try:
        dep_in = os.environ["ISSUE_BODY"]
    except KeyError:
        sys.exit( "Unable to get ISSUE_BODY" )

    # decode incoming string
    dep_in = refine_dependency.decode_github_env( dep_in )

    # check for jira api key environment variable
    try:
        jira_api_key = os.environ["JIRA_API_KEY"]
    except KeyError:
        sys.exit( "Unable to get JIRA_API_KEY" )

    # check for jira board environment variable
    try:
        project_key = os.environ["JIRA_BOARD"]
    except KeyError:
        sys.exit( "Unable to get JIRA_board" )

    # check for level flags
    try:
        level_flags = os.environ["LEVEL_FLAGS"]
    except KeyError:
        sys.exit( "Unable to get level flags" )

    return ( level_flags, dep_in, jira_api_key, project_key )

def main():
    """
    Works through the steps to refine dependency list and then create tickets in
    JIRA. 
    """

    too_many_tickets = False
    warning_message = ""
    level_flags, dep_in, jira_api_key, project_key = get_env_variables()

    # establish https connection and necessary variables
    conn = http.client.HTTPSConnection( "citz-imb.atlassian.net" )
    auth_string = "Basic " + jira_api_key
    headers = {
        'Content-Type': 'application/json',
        'Authorization': auth_string
    }

    # get the list of summaries from JIRA
    summary_li = jira_con.get_summary_list( conn, headers, project_key )
    # get the list of dependencies from GitHub
    li_patch, li_minor, li_major = refine_dependency.parse_dependencies( level_flags, dep_in )

    # check if dependency lists are empty -> there are no tickets to create
    sum_dependencies = len( li_patch ) + len( li_major ) + len( li_major )
    if sum_dependencies == 0:
        sys.exit( "No dependencies" )

    # remove any dependencies that exist in both lists
    patch = refine_dependency.remove_duplicates( li_patch, summary_li )
    minor = refine_dependency.remove_duplicates( li_minor, summary_li )
    major = refine_dependency.remove_duplicates( li_major, summary_li )

    # Check if there are any tickets left after removing duplicates or if there are too many
    sum_dependencies = len( patch ) + len( minor ) + len( major )

    if sum_dependencies == 0:
        sys.exit( "No unique tickets to create" )

    elif sum_dependencies > 50:
        # if there are too many tickets warn user
        too_many_tickets = True
        print("WARN: More than 50 tickets to create. ")
        remove_num = sum_dependencies - 50

        # if there are enough patch updates to clear 50 
        if len( patch ) >= remove_num:
            warning_message = "some patch"
            patch = patch[:-remove_num]
        # if there are enough patch + minor updates to clear 50
        elif len(patch) + len(minor) >= remove_num:
            warning_message = "all patch and some minor"
            remove_num = remove_num - len(patch)
            patch = []
            minor = minor[:-remove_num]
        # if we have to clear some major updates as well. 
        else:
            warning_message = "all patch, all minor, and some major"
            remove_num = remove_num - (len(patch) + len(minor))
            patch = []
            minor = []
            major = major[:-remove_num]

    # if there is a ticket to create post all tickets and capture response
    updates = ( patch, minor, major, )
    create_and_post.create_tickets( conn, headers, updates, project_key )

    # if too many tickets flag was set allow the script to finish but then exit with an error
    if too_many_tickets:
        warn = "WARN: Tickets posted but " + warning_message + " updates have been dropped."
        sys.exit( warn )


if __name__=="__main__":
    main()
