
from service.models import sheets
sheet = sheets.MasterSheet("/home/richard/Dropbox/Projects/WNA/MasterSheet.csv")
obs = [o for o in sheet.objects()]