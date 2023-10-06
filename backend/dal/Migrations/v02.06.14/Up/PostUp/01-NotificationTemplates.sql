PRINT 'Updating NotificationTemplates'

-- Replace the instances of old pdf link with the new one
UPDATE [pims].dbo.[NotificationTemplates]
SET [Body] = REPLACE([Body], 'https://intranet.gov.bc.ca/assets/intranet/mtics/real-property/sres/process_manual_for_the_surplus_properties_program_-_feb_2020_-_version_2.pdf', 'https://intranet.gov.bc.ca/assets/intranet/mtics/real-property/who-we-are/branch-sres/process_manual_for_the_surplus_properties_program_-_feb_2020_-_version_2.pdf')
WHERE Body LIKE '%https://intranet.gov.bc.ca/assets/intranet/mtics/real-property/sres/process_manual_for_the_surplus_properties_program_-_feb_2020_-_version_2.pdf%';

