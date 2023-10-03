"""
Modules used for json formatting, regex parsing, and error handling
"""
import json
import re
import error

## **********************************************************************
##
## This script hosts functions that are used to send requests to JIRA API
##
## **********************************************************************

def send_request(conn, req_type, where, payload, headers):
    """
    Single source for sending requests to JIRA. Errors or 
    bad responses will not be handled here. 
    """
    
    # define and capture request. return the result
    conn.request( req_type, where, payload, headers)
    res = conn.getresponse()

    return res


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
        # try to match ticket summary to this
        sum_refined = re.search( r"Update (.*) from version .*", summary )
        #if it does not match ignore it
        if sum_refined is None:
            continue

        # if it matches extract the depenency name
        sum_refined = sum_refined.group(1)

        # if the summary is not already in the list add it
        if sum_refined not in summary_li:
            summary_li.append( sum_refined )

    # return the list of dependencies from update tickets
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
    jql_project = "project = " + project_key
    jql_text = " AND text ~ \"update from version\""
    jql_status = " AND status != Done"
    jql_labels = " AND labels = DependencyUpdates"
    jql_string = jql_project + jql_text + jql_status + jql_labels

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
    res = send_request(conn, "POST", "/rest/api/3/search", payload, headers)
    data = res.read()
    data = data.decode( "utf-8" )

    # check if we get OK response. If not exit with message
    if res.status != 200:
        message = "Error Requesting JIRA tickets. "
        status = str( res.status )
        reason = res.reason
        error_message = message + status + ": " + reason + "\n"
        raise error.APIError( error_message )

    json_in = json.loads( data )

    summary_li = parse_tickets( json_in )
    return summary_li
