"""
Modules providing HTTP connections, json formatting,
regex, operating system, and system operations
"""
import http.client
import json
import re
import sys
import os

## **********************************************************************
##
## This script pulls in relevant JIRA tickets and dependency updates
## to create new tickets to cover weekly dependency updates.
##
## May want to add the following features in the future
##       Check for similar names like eslint/parser... vs eslint ect
##       Env variable to hold create_subtasks value for issue id
##        - has to be updated for each board depending on what version of subtasks they use
##       Check max results vs. total results in get_summary_list
##       Major vs minor tickets (priority levels)
##       label ID (dependency/updtes)
##        move to .github/helpers
##         - add documentation for script there in README
## **********************************************************************

def exit_with_error( error_message, data, res ):
    """
    Used to exit the program gracefully when hitting an error or getting 
    an invalid response 

    Args:
      error_message (string): specific message to location in script that error was hit
      data (string): response from http request
      res (http.client.HTTPResponse): response from http request
    """

    # get the status and reason from the response
    status = str( res.status )
    reason = res.reason
    # finalize log message and exit
    message = error_message + " " + status + " " + reason + "\n" + data
    sys.exit( message )

def parse_tickets( tickets_json ):
    """
     Takes in previous JIRA tickets in json format
     pulls out the summary (title) and puts them into a list.

     Args: 
       tickets_json (json): data pulled in from JIRA 

     Returns: 
       summary_li (list): list of summaries extracted from tickets_json
    """

    summary_li = []

    # remove top element to access issues directly
    issue_list = tickets_json['issues']

    for issue in issue_list:
        # extract the summary field form the json object
        summary = issue['fields']['summary']
        # if the summary is not already in the list add it
        if summary not in summary_li:
            summary_li.append( summary )
    # return the list of summaries
    return summary_li

def get_summary_list( conn, headers, project_key ):
    """
    Make an API POST request for current JIRA tickets narrowing down the search by a JQL 
    (JIRA Query Language) filter. Then sends response to be processed and returns processed list

    Args:
      conn (HTTPSConnection): specifies where to make the connection
      headers (string): supplies authentication to connect to JIRA
      project_key (string): defines project key of JIRA board we want to post to 
    
    Returns: 
      summary_li (list): sudo json data in from JIRA containing ticket information
    """

    summary_li = []
    #specifies JIRA query to filter results and max results
    jql_string = "project = " + project_key + " AND text ~ \"update\" AND status != Done"
    max_results = 100

    # will be used as the requesting json for specific ticket matches
    payload = json.dumps({
        "expand": [
            "names"
        ],
        "fields": [
            "summary",
            "status"
        ],
        "jql": jql_string,
        "maxResults": max_results,
        "startAt": 0
    })

    # send request
    conn.request( "POST", "/rest/api/3/search", payload, headers )
    res = conn.getresponse()
    data = res.read()
    data = data.decode( "utf-8" )

    # check if we get OK response. If not exit with message
    if res.status != 200:
        error_message = "Error Requesting JIRA tickets. "
        exit_with_error( error_message, data, res )

    json_in = json.loads( data )

    summary_li = parse_tickets( json_in )
    return summary_li

def refine_updates( in_dep_str, refine_word ):
    """
    Used to parse through incoming dependency update text and pull out the
    two sections that are surrounded by the argument refine_word. The two
    sections are then concatanated and returned as a str. 

    Args:
      in_dep_str (string): string in from environment variable
      refine_word (string): given word that surrounds the section we are trying to extract

    Returns:
      refined (string): concatinated dependency updates of the defined refine_word sections
    """

    refined_str = ""
    refined_str_dev = ""

    # get the first section of refine_word
    start = re.search( refine_word, in_dep_str)
    end = re.search(refine_word + ".:", in_dep_str)
    # if either are none there is an error or the section doesnt exist
    if not (start is None or end is None):
        refined_str = in_dep_str[start.end(): end.start()]

    # get the dev section of refine_word
    start_dev = re.search( refine_word + "_dev", in_dep_str )
    end_dev = re.search( refine_word + "_dev.:", in_dep_str )
    # if either are none there is an error or the section doesnt exist
    if not (start_dev is None or end_dev is None):
        refined_str_dev = in_dep_str[start_dev.end(): end_dev.start()]

    # concatinate the two sections and return it
    refined = refined_str + refined_str_dev
    return refined

def remove_patch_dep( in_str ):
    """
    Used to parse through the incoming dependency update text and pull out the 
    two patch update spots as we only want tickets for minor and major updates.

    Args: 
      in_str (string): string in from environment variable

    Returns: 
      final_str (string): string of dependency updates without any patch updates.
    """

    # find the first section of patch updates
    start_patch = re.search( r'\[patch\]', in_str )
    end_patch = re.search( r'\[patch\]:', in_str )

    # quick maths and splicing to remove first patch section
    first_removal = in_str[:start_patch.start()]
    second_removal = in_str[end_patch.end():]
    dep_str = first_removal + second_removal

    # find the second patch of patch updates
    start_patch = re.search( r'\[patch_dev\]', dep_str )
    end_patch = re.search( r'\[patch_dev\]:', dep_str )

    # more maths and splices to remove second patch section
    first_removal = dep_str[:start_patch.start()]
    second_removal = dep_str[end_patch.end():]
    final_str = first_removal + second_removal
    
    return final_str


def parse_dependencies( dep_text ):
    """
    This takes in a dependency update text (very specific format see 
    https://github.com/bcgov/PIMS/issues/1706#issue-1899122308)
    searches for the first occurance of "minor" (we can ignore patch updates)
    then pulls all update strings into a list.

    Args: 
      dep_text (string): dependency update string

    Returns: 
      dep_li (list): list with string elements of dependency updates
    """

    dep_li_minor = []
    dep_li_major = []

    dep_text_minor = refine_updates( dep_text, "minor" )
    dep_text_major = refine_updates( dep_text, "major" )

    # go through remaining dependencies add all starting with "-" to list
    for line in dep_text_minor.splitlines():
        if re.match( r'^-.*', line ):
            dep_li_minor.append( line )

    # go through remaining major dependencies and add all starting with "-" to list
    for line in dep_text_major.splitlines():
        if re.match( r'^-.*', line ):
            dep_li_major.append( line )

    # return list containing all dependency updates
    return [dep_li_minor, dep_li_major]

def remove_duplicates( in_dep, in_sum ):
    """
    Goes through the dependency lists, checks to see if the dependency listed 
    already has a ticket capturing the work. 
      - If yes we remove that dependency from the list and move to the next
      - If no we leave the dependency in the list and move to the next

    Args: 
      in_dep (list[string]): a list containing all dependency updates
      in_dev_dep ()
      in_sum (list[string]): a list containing all ticket summaries

    Returns: 
      new_li (list[string]): a list containing only elements that exist from
             in_dep that did not exist in in_sum
    """

    new_li = []

    for dependency in in_dep:
        # add dependency to list
        new_li.append( dependency )

        # check the dependency for a match and get the dependency
        check_str = re.search( r"^- `(.*)` Update", dependency )
        check_str = check_str.group(1)
        # go through summary list
        for summary in in_sum:
            if check_str in summary:
                # if the dependency is in the summary remove it from the
                # list and go to the next dependency
                new_li.remove( dependency )
                break
    return new_li

def create_parent_ticket( conn, headers, project_key ):
    """
    POST API to create a parent ticket on the specified board

    Args:
      conn (HTTPSConnection): specifies where to make the connection
      headers (string): supplies authentication to connect to JIRA
      project_key (string): defines project key of JIRA board we want to post to 

    Returns:
      parent_key (string): captures key of created ticket 
    """

    # json object to create parent ticket
    parent_ticket = json.dumps({
        "fields": {
            "project": {
                "key": project_key
            },
            "summary": "Dependency Updates",
            "issuetype": {
                "name": "Task"
            },
            "priority": {
                "name": "Medium"
            },
            "labels": [
                "DependencyUpdates"
            ]
        }
    })
    # send post request to create parent ticket and capture response
    conn.request( "POST", "/rest/api/2/issue/", parent_ticket, headers )
    res = conn.getresponse()
    data = res.read()
    data = data.decode( "utf-8" )

    # check if we get OK response. If not exit with message
    if res.status != 201:
        error_message = "Got bad response when trying to create parent ticket. "
        exit_with_error( error_message, data, res )

    readable_data = json.loads( data )
    # get the key from the response and return it
    parent_key = readable_data["key"]
    return parent_key

def break_update_down( update ):
    """
    Takes in a string with an update detailed and rearanges to the format we want
      "Update <dependency> from `<old version>` to `<new version>'
    
    Args:
      update (string): string holding current dependency update

    Returns:
      summary (string): reformated string holding current dependency update
    """

    # seperate dependency into 2 groups
    check_str = re.search( r"^- `(.*)` Update (from version `.*` to `.*`)", update )
    # reformat line
    summary = "Update " + check_str.group(1) + " " + check_str.group(2)
    return summary

def create_subtasks( version, update_list, parent_key, project_key ):
    """
    For every element in update_list we create a ticket dictionary and add it
    to the list of elements. Then we create an overarching dictionary with one
    parent element. Then it is converted to a JSON object. 

    Args: 
      update_list (list[string]): list of dependencies to update
      parent_key (string): specifies what ticket to post under
      project_key (string): specifies what project to post tickets to

    Returns: 
      json_tickets (json): JSON object contining sub tasks 
                for all dependency updates.
    """

    dict_update_list = []
    priority_level = ""

    if version == "minor":
        priority_level = "Medium"
    elif version == "major":
        priority_level = "High"
    elif version == "patch":
        priority_level = "Low"

    for update in update_list:
        # reformat the string to how we want the summary to look
        summary_title = break_update_down( update )

        current = {
            "update": {},
            "fields": {
                "project": {
                    "key": project_key
                },
                "parent": {
                    "key": parent_key
                },
                "issuetype": {
                    "id": "10113" 
                },
                #"priority": {
                    #"name": priority_level
                #},
                "labels": [
                    "DependencyUpdates"
                ],
                "summary": summary_title
            }
        }
        # add to list of updates
        dict_update_list.append( current )

    # add header element reformat into json and return
    ticket_dict = {"issueUpdates": dict_update_list}
    json_tickets = json.dumps( ticket_dict )
    return json_tickets


def create_tickets( conn, headers, update_minor, update_major, project_key ):
    """
    POSTS API request to create all sub tasks.

    Args:
      conn (HTTPSConnection): specifies where to make the connection
      headers (string): specifies authentication to post to JIRA
      update_list (list): list of sub tasks to transform into tickets
      project_key (string): specifies wha project to post to

    """

    # create and post parent ticket. Capture returned key
    parent_key = create_parent_ticket( conn, headers, project_key )
    # create subtasks and capture json object containing them
    json_subtasks_minor = create_subtasks( "minor", update_minor, parent_key, project_key )
    json_subtasks_major = create_subtasks( "major", update_major, parent_key, project_key )
    # post subtasks capture response
    conn.request( "POST", "/rest/api/2/issue/bulk", json_subtasks_minor, headers )
    res = conn.getresponse()
    data = res.read()
    data = data.decode( "utf-8" )

    # check if we get OK response. If not exit with message
    if res.status != 201:
        error_message = "Error Posting JIRA sub-tickets 1. Client sent back: "
        exit_with_error( error_message, data, res )

    conn.request( "POST", "/rest/api/2/issue/bulk", json_subtasks_major, headers )
    res = conn.getresponse()
    data = res.read()
    data = data.decode( "utf-8" )

    # check if we get OK response. If not exit with message
    if res.status != 201:
        error_message = "Error Posting JIRA sub-tickets 2. Client sent back: "
        exit_with_error( error_message, data, res )

def decode_github_env( encoded_str ):
    """
    Used to decode the environment variable that is produced from 
    .github/helpers/check-npm-dependencies.js
    See workflow job: check-versions and create-issue for more information on the encoding. 

    Args:
      encoded_str (string): string holding specifically encoded environment variable.

    Returns:
      decoded_str (string): string holding decoded string value. 
    """

    decoded_str = encoded_str.replace( '%25', '%' )
    decoded_str = decoded_str.replace( '%0A', '\n' )
    decoded_str = decoded_str.replace( '%0D', '\r' )
    return decoded_str

def main():
    """
    Works through the steps to refine dependency list and then create tickets in
    JIRA. 
    """

    # check for dependency environment variable
    try:
        dep_in = os.environ["ISSUE_BODY"]
    except KeyError:
        sys.exit( "Unable to get ISSUE_BODY" )

    # decode incoming string
    dep_in = decode_github_env( dep_in )

    # check for jira api key environment variable
    try:
        jira_api_key = os.environ["JIRA_API_KEY"]
    except KeyError:
        sys.exit( "Unable to get JIRA_API_KEY" )

    # establish https connection and necessary variables
    conn = http.client.HTTPSConnection( "citz-imb.atlassian.net" )
    auth_string = "Basic " + jira_api_key
    headers = {
        'Content-Type': 'application/json',
        'Authorization': auth_string
    }
    # define project key to post and read tickets from
    project_key = "TES"

    # get the list of summaries from JIRA
    summary_li = get_summary_list( conn, headers, project_key )
    # get the list of dependencies from GitHub
    dependency_li_minor, dependency_li_major = parse_dependencies( dep_in )

    # check if dependency lists are empty -> there are no tickets to create
    if len( dependency_li_minor ) == 0 and len( dependency_li_major ) == 0:
        sys.exit( "No dependencies" )

    # remove any dependencies that exist in both lists
    final_li_minor = remove_duplicates( dependency_li_minor, summary_li )
    final_li_major = remove_duplicates( dependency_li_major, summary_li )

    if len( final_li_minor ) != 0 and len( final_li_major ) != 0:
        # if there is a ticket to create post all tickets and capture response
        create_tickets( conn, headers, final_li_minor, final_li_major, project_key )


if __name__=="__main__":
    main()
