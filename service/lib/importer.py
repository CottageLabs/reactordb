from service.models import MasterSheet, PRISSheet, Reactor, OperatingHistorySheet, Operation
from datetime import datetime

STATUS_MAP = {
    "Operational" : "Operable"
}

def import_reactordb(master_path, pris_path, history_path):

    # first thing to do is drop the preview indexes ("next"), so the following import
    # can re-create them
    Reactor.drop_next()
    Operation.drop_next()

    master = MasterSheet(master_path)
    pris = PRISSheet(pris_path)
    history = OperatingHistorySheet(history_path)

    # read the pris reactors into a dictionary that we can use for lookup
    scrape = {}
    for p in pris.objects():
        scrape[p.get("reactor_name")] = p

    # do the same for the operating history
    oh = {}
    for d in history.dataobjs(Operation):
        if d.reactor in oh:
            oh[d.reactor].append(d)
        else:
            oh[d.reactor] = [d]

    # only import records which have a value in the master spreadsheet
    for obj in master.objects():
        # get the pris record if there is one
        pris_record = scrape.get(obj.get("reactor_name"))

        # get the operational history if it exists
        histories = oh.get(obj.get("reactor_name"), [])

        # use the reactor name as the id too
        obj["id"] = obj["reactor_name"]

        # now write the values from the pris record to the master record if
        # the master does not have a value
        if pris_record is not None:
            for k, v in pris_record.iteritems():
                if k not in obj:
                    obj[k] = v
                elif obj[k] is None:
                    obj[k] = v

        # overwrite the reactor name if an wna_name has been provided
        if obj.get("wna_name", None) is not None:
            obj["reactor_name"] = obj["wna_name"]
            del obj["wna_name"]

        # finally check the master for the "delete value" marker (a "-")
        for k, v in obj.items():
            if v == "-":
                del obj[k]

        # translate the status to the internally preferred value if necessary
        obj["status"] = STATUS_MAP.get(obj.get("status"), obj.get("status"))

        _add_operation_data(obj, histories)
        _add_status_data(obj)

        # make and populate a reactor object, then save it
        r = Reactor()
        r.populate(obj)
        r.save()

        # save the operational history
        for h in histories:
            h.country = r.country
            h.save()


def _add_operation_data(obj, histories):

    fields = [
        "annual_time_online",
        "operation_factor",
        "load_factor_cumulative",
        "load_factor_annual",
        "energy_availability_factor_annual",
        "electricity_supplied",
        "energy_availability_factor_cumulative",
        "reference_unit_power"
    ]

    cumulative = [
        "electricity_supplied"
    ]

    obj["operation"] = {}

    for h in histories:
        year = h.year
        for f in fields:
            if f not in obj["operation"]:
                obj["operation"][f] = {}
            val = h.__getattr__(f)
            if val is None:
                val = 0.0
            obj["operation"][f][str(year)] = float(val)

    for c in cumulative:
        if c not in obj["operation"]:
            continue
        cf = c + "_cumulative"
        obj["operation"][cf] = {}
        data = obj["operation"][c]
        years = data.keys()
        years.sort()
        total = 0.0
        for year in years:
            total += data[year]
            obj["operation"][cf][str(year)] = total


def _add_status_data(obj):
    if "operation" not in obj:
        obj["operation"] = {}
    obj["operation"]["operational_status"] = {}
    context = obj["operation"]["operational_status"]

    construction_start = obj.get("construction_start")
    end = datetime.utcnow().year

    if not construction_start:
        context[end] = "pre_construction"
        return

    start = _milestone_year(obj, "construction_start")

    permanent_shutdown = _milestone_year(obj, "permanent_shutdown")
    restart = _milestone_year(obj, "restart")
    longterm_shutdown = _milestone_year(obj, "longterm_shutdown")
    first_grid_connection = _milestone_year(obj, "first_grid_connection")
    construction_restart = _milestone_year(obj, "construction_restart")
    construction_suspend = _milestone_year(obj, "construction_suspend")

    for year in range(end, start - 2, -1):
        if permanent_shutdown is not None and year >= permanent_shutdown:
            context[year] = "permanent_shutdown"
            continue
        if longterm_shutdown is not None and year >= longterm_shutdown:
            if restart is not None and year < restart:
                context[year] = "longterm_shutdown"
                continue
            if restart is None:
                context[year] = "longterm_shutdown"
                continue
        if restart is not None and year >= restart:
            context[year] = "operable"
            continue
        if first_grid_connection is not None and year >= first_grid_connection:
            context[year] = "operable"
            continue
        if construction_suspend is not None and year >= construction_suspend:
            if construction_restart is not None and year < construction_restart:
                context[year] = "construction_suspended"
                continue
            if construction_restart is None:
                context[year] = "construction_suspended"
                continue
        if construction_restart is not None and year >= construction_restart:
            context[year] = "under_construction"
            continue
        if start is not None and year >= start:
            context[year] = "under_construction"
            continue
        context[year] = "pre_construction"

def _milestone_year(obj, milestone):
    milestone_date = obj.get(milestone)
    if not milestone_date:
        return None
    return datetime.strptime(milestone_date, "%Y-%m-%d").year