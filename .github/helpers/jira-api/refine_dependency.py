""" 
Import Regex for some parsing. 
May look into how we can accomplish this without regex in the future
"""
import re

## **********************************************************************
##
## This script hosts functions that are used to decode env variables,
## remove matching elements from lists, and refine and parse the
## dependency list.
##
## **********************************************************************

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

    # holders for returned list and tickets to only hold dependency name
    new_li = []

    for dependency in in_dep:
        # add dependency to list
        new_li.append( dependency )

        # check the dependency for a match and get the dependency
        check_str = re.search( r"^- `(.*)` Update", dependency )
        check_str = check_str.group(1)
        # go through summary list
        for summary in in_sum:
            if check_str == summary:
                # if the dependency is in the summary remove it from the
                # list and go to the next dependency
                new_li.remove( dependency )
                break
    return new_li

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
