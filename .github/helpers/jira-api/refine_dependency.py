""" 
Import Regex for some parsing. 
May look into how we can accomplish this without regex in the future
"""
import re

###################################################################################################
##
## This script hosts functions that are used to decode env variables, remove matching elements from
## lists, and refine and parse the dependency list.
##
###################################################################################################

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
      in_dep (list[string], list[datring]): a list containing tuples of dependency updates
          and update strings
      in_sum (list[string]): a list containing all ticket summaries

    Returns: 
      new_li (list[string]): a list containing only elements that exist from
          in_dep that did not exist in in_sum
    """

    # holders for returned list and tickets to only hold dependency name
    new_li = []

    for ele in in_dep:
        # get the first elemet of the tuple which is the dependency update
        dependency = ele[0]
        # add tuple to list
        new_li.append( ele )

        # check the dependency for a match and get the dependency
        check_str = re.search( r"^- `(.*)` Update", dependency )
        check_str = check_str.group(1)
        # go through summary list
        for summary in in_sum:
            if check_str == summary:
                # if the dependency is in the summary remove the tuple from the
                # list and go to the next tuple
                new_li.remove( ele )
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

def refine_dependencies( string_in ):
    """
    This method takes in a string, reformats it into a list then goes through the list to 
    first add desired lines into a new list, then goes through that list to couple the update
    and update string into a tuple, which is added to a new list and returned. 

    Args:
      string_in (string): string value holding information on dependency updates

    Returns:
      new_li (list): a list of tuples with the following form ('dependency_update', 'update_string')
    """

    new_li = []
    temp_li = []
    # split incoming string into a list on the newline character
    li_in = string_in.splitlines()

    # go through list and if the line starts with "npm" or "- `" add it to a new list
    for line in li_in:
        check_str = line[:3]
        if check_str == "npm" or check_str == "- `":
            temp_li.append(line)

    # for every line in the refined list create a tuple containing the line and the
    # line immediatly following.
    for index, line in enumerate(temp_li):
        if line[:3] == "- `":
            new_ele = ( line, temp_li[index + 1] )
            new_li.append( new_ele )

    return new_li


def parse_dependencies( level_flags, dep_text ):
    """
    This takes in a dependency update text (very specific format see 
    https://github.com/bcgov/PIMS/issues/1706#issue-1899122308)
    searches for the first occurance of "minor" (we can ignore patch updates)
    then pulls all update strings into a list.

    Args: 
      level_flags (string): env variable definind the levels of dependencies we want to check for
      dep_text (string): dependency update string

    Returns: 
      dep_li (list): list with string elements of dependency updates
    """

    dep_li_patch = []
    dep_li_minor = []
    dep_li_major = []

    # split env variables into a list
    li_levels = level_flags.split()

    # if PATCH is listed in env flag grab that section of the report and then refine it
    if "PATCH" in li_levels:
        dep_text_patch = refine_updates( dep_text, "patch" )
        dep_li_patch = refine_dependencies( dep_text_patch )

    # if MINOR is listed in env flag grab that section of the report and then refine it
    if "MINOR" in li_levels:
        dep_text_minor = refine_updates( dep_text, "minor" )
        dep_li_minor = refine_dependencies( dep_text_minor )

    # if MAJOR is listed in env flag grab that section of the report and then refine it
    if "MAJOR" in li_levels:
        dep_text_major = refine_updates( dep_text, "major" )
        dep_li_major = refine_dependencies( dep_text_major )

    # create a tuple of lists of dependency updates.
    dep_li = [dep_li_patch, dep_li_minor, dep_li_major]
    return dep_li
