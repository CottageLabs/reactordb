from service.models import MasterSheet, PRISSheet, Reactor

def import_reactordb(master_path, pris_path, history_path):
    master = MasterSheet(master_path)
    pris = PRISSheet(pris_path)

    # read the pris reactors into a dictionary that we can use for lookup
    scrape = {}
    for p in pris.objects():
        scrape[p.get("reactor_name")] = p

    reactors = []
    for obj in master.objects():
        # get the pris record if there is one
        pris_record = scrape.get(obj.get("reactor_name"))

        # overwrite the reactor name if an wna_name has been provided
        if obj.get("wna_name", "") != "":
            obj["reactor_name"] = obj["wna_name"]
            del obj["wna_name"]

        # now write the values from the pris record to the master record if
        # the master does not have a value
        if pris_record is not None:
            for k, v in pris_record.iteritems():
                if k not in obj:
                    obj[k] = v
                elif obj[k] is None:
                    obj[k] = v

        # finally, make and populate a reactor object
        r = Reactor()
        r.populate(obj)
        reactors.append(r)

    for r in reactors:
        r.save()
