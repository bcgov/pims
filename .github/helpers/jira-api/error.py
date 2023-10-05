"Import for system actions. Allowing us to exit gracefully."
import sys

###################################################################################################
##
## This script hosts the error we will throw (raise) when a bad response
## is hit from a http connection.
##
###################################################################################################

class APIError(Exception):
    "raised when we hit an API error"
    def __init__( self, error_message,):
        """
        Used to exit the program gracefully when getting an invalid response 

        Args:
        error_message (string): specific message to location in script that error was hit
            This string may contain specific status and data to diagnose why it was hit.
        """
        # finalize log message and exit
        sys.exit( error_message )
