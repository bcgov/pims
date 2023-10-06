"""
Modules providing HTTP connections, json formatting, regex, operating system, and system operations
as well as: 
Modules used to connect to JIRA API, refining dependency updates and posting tickets.
"""
import http.client
import sys
import os

import jira_con
import refine_dependency
import refine_tickets

###################################################################################################
##
## This script pulls in relevant JIRA tickets and dependency updates to create new tickets to cover
## weekly dependency updates.
##
## It uses the following scripts to do the heavy lifting of the group:
##     - jira_con.py: used for connection to JIRA
##     - refine_dependency: used for refining strings and lists
##     - create_and_post.py: used for creating the tickets to create
##     - errors.py (not used in this script) our own error class to
##         catch bad results from API calls
##
## May want to add the following features in the future
##       Check max results vs. total results in get_summary_list
##       Send 2 request when over 50 updates instead of trunkating.
##       look into not using regex.
##       set up env file for environment variables (level flags ect.)
##       *** diagram for security and priv.
##
###################################################################################################

def get_env_variables():
    """
    This method does the work for setting environment variables to be used in this script. We will
    also catch and report any errors as they arise. 
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

def refine_dep( level_flags, dep_in, summary_li ):
    """
    Used to parse the dependencies into format we want them

    Args: 
      level_flags (string): env variable setting what updates we are going to parse
      dep_in (string): env variacle holding dependency list
      summary_li (list[string]): list holding all ticket summaries we searched for

    Returns: 
      updates (tuple): tuple containing reformated lists of updates
    """

    # get the list of dependencies from GitHub
    li_patch, li_minor, li_major = refine_dependency.parse_dependencies( level_flags, dep_in )

    # remove any dependencies that exist in both lists
    li_patch = refine_dependency.remove_duplicates( li_patch, summary_li )
    li_minor = refine_dependency.remove_duplicates( li_minor, summary_li )
    li_major = refine_dependency.remove_duplicates( li_major, summary_li )

    updates = ( li_patch, li_minor, li_major, )
    return updates

def create_and_post_tickets( conn, headers, updates, project_key ):
    """
    This function captures the work necessary for creating, finalization, and posting tickets. 

    Args: 
      conn (HTTPSConnection): specifies where to make the connection
      headers (string): specifies authentication to post to JIRA
      updates (tuple(list)): a tuple of lists holding the dependency updates
      project_key (string): a string representing the key for the board we want to post to
    """

    # check the number of tickets to post
    too_many_tickets, updates = refine_tickets.check_num_tickets( updates )
    # create parent ticket and post it
    parent_ticket_json = refine_tickets.create_parent_ticket( project_key, updates )
    parent_key = jira_con.post_parent_ticket( conn, headers, parent_ticket_json )
    # create sub tasks and post them
    subtask_json = refine_tickets.create_tickets( updates, project_key, parent_key )
    jira_con.post_subtasks( conn, headers, subtask_json )

    # if too many tickets flag was set allow the script to finish but then exit with an error
    if too_many_tickets:
        sys.exit("WARN: Too many tickets")

def main():
    """ Works through the steps to refine dependency list and then create tickets in JIRA. """

    level_flags, dep_in, jira_api_key, project_key = get_env_variables()

    # establish https connection and necessary variables
    conn = http.client.HTTPSConnection( "citz-imb.atlassian.net" )
    headers = {
        'Content-Type': 'application/json',
        'Authorization': "Basic " + jira_api_key
    }

    # get the list of summaries from JIRA
    summary_li = jira_con.get_summary_list( conn, headers, project_key )

    # refine dependencies
    updates = refine_dep( level_flags, dep_in, summary_li )

    # create and post all tickets
    create_and_post_tickets( conn, headers, updates, project_key )


if __name__=="__main__":
    main()
