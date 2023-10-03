"""Importing modules for parsing, json formatting, and errors"""
import re
import json
import error

## **********************************************************************
##
## This script hosts functions that are used to reformat given strings,
## create specific format and post parent and subtask tickets.
##
## **********************************************************************

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
        status = str( res.status )
        reason = res.reason
        message = "Got bad response when trying to create parent ticket.\n"
        error_message = message + status + ": " + reason + "\n"
        raise error.APIError( error_message )

    readable_data = json.loads( data )
    # get the key from the response and return it
    parent_key = readable_data["key"]
    return parent_key

def create_subtasks( version, update_list, parent_key, project_key ):
    """
    For every element in update_list we create a ticket dictionary and add it
    to the list of elements. Then we create an overarching dictionary with one
    parent element. Then it is converted to a JSON object. 

    Args: 
      version (string): delegation between minor/major/patch update
      update_list (list[string]): list of dependencies to update
      parent_key (string): specifies what ticket to post under
      project_key (string): specifies what project to post tickets to

    Returns: 
      dict_update_list (list): list contining sub tasks for specified dependency updates.
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
                "priority": {
                    "name": priority_level
                },
                "labels": [
                    "DependencyUpdates"
                ],
                "summary": summary_title
            }
        }
        # add to list of updates
        dict_update_list.append( current )

    return dict_update_list

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

    # merge the dicrionaries
    dict_update_list = json_subtasks_minor + json_subtasks_major

    # add header element reformat into json
    ticket_dict = {"issueUpdates": dict_update_list}
    json_tickets = json.dumps( ticket_dict )

    # post subtasks capture response
    conn.request( "POST", "/rest/api/2/issue/bulk", json_tickets, headers )
    res = conn.getresponse()
    data = res.read()
    data = data.decode( "utf-8" )

    # check if we get OK response. If not exit with message
    if res.status != 201:
        status = str( res.status )
        reason = res.reason
        message = "Error Posting JIRA sub-tickets 1. Client sent back: "
        error_message = message + status + ": " + reason + "\n"
        raise error.APIError( error_message )
