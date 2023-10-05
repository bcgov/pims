""" Importing modules for parsing, json formatting, and errors """
import re
import sys
import json
import error

###################################################################################################
##
## This script hosts functions that are used to reformat given strings, create specific format and
## post parent and subtask tickets.
##
###################################################################################################

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
        error_message = message + status + ": " + reason + "\n" + data
        raise error.APIError( error_message )

    readable_data = json.loads( data )
    # get the key from the response and return it
    parent_key = readable_data["key"]
    return parent_key

def create_subtasks( version, update_list, parent_key, project_key ):
    """
    For every element in update_list we create a ticket dictionary and add it to the list of
    elements. Then we create an overarching dictionary with one parent element. Then it is 
    converted to a JSON object. 

    Args: 
      version (string): delegation between minor/major/patch update
      update_list (list[string], list[string]): list of tuples containing dependencies to update
          and update string
      parent_key (string): specifies what ticket to post under
      project_key (string): specifies what project to post tickets to

    Returns: 
      dict_update_list (list): list contining sub tasks for specified dependency updates.
    """

    dict_update_list = []
    priority_level = ""

    # set priority level based on what type of dependency we are working through
    if version == "minor":
        priority_level = "Medium"
    elif version == "major":
        priority_level = "High"
    elif version == "patch":
        priority_level = "Low"

    for update in update_list:
        # reformat the string to how we want the summary to look
        summary_title = break_update_down( update[0] )
        description = "To update please run the following command:\n\n' " + update[1] + " '"

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
                "summary": summary_title,
                "description": description
            }
        }
        # add to list of updates
        dict_update_list.append( current )

    return dict_update_list

def check_num_tickets( updates ):
    """
    This method takes in the three lists (as one tuple), checks how many dependencies are listed, 
    and then will return the lists and the flag we have set. 

    Args:
      updates (tuple): Holds the three dependency update lists. 

    Returns:
      too_many_tickets (bool): flag set to catch if we have more than 50 tickets to create.
      updates (tuple): Holds the three dependency lists with the assurance that the number of 
          dependencies is <= 50. 
    """

    too_many_tickets = False
    patch, minor, major = updates
    sum_dependencies = len( patch ) + len( minor ) + len( major )

    # Check if there are any tickets left after removing duplicates or if there are too many
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

    print("Tickets were posted but " + warning_message + " were dropped.")
    update = (patch, minor, major)
    return too_many_tickets, update

def create_tickets( conn, headers, updates, project_key ):
    """
    POSTS API request to create parent ticket and all sub tasks.

    Args:
      conn (HTTPSConnection): specifies where to make the connection
      headers (string): specifies authentication to post to JIRA
      updates (tuple): tuple of three lists, each containing sub tasks to transform into tickets
      project_key (string): specifies wha project to post to

    """

    # break the updates back into 3 seperate lists
    update_patch, update_minor, update_major = updates
    # create and post parent ticket. Capture returned key
    parent_key = create_parent_ticket( conn, headers, project_key )
    # create subtasks and capture json object containing them
    json_subtasks_patch = create_subtasks( "patch", update_patch, parent_key, project_key )
    json_subtasks_minor = create_subtasks( "minor", update_minor, parent_key, project_key )
    json_subtasks_major = create_subtasks( "major", update_major, parent_key, project_key )

    # merge the dicrionaries
    dict_update_list = json_subtasks_patch + json_subtasks_minor + json_subtasks_major

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
        message = "Error Posting JIRA sub-tickets. Client sent back: "
        error_message = message + status + ": " + reason + "\n" + data
        raise error.APIError( error_message )
