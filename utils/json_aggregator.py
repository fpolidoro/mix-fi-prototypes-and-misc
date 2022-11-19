import csv
import json
import glob

ROOT_PATH = '/home/fab/Scrivania/samsunghealth_202210101028'

BIN = 'binning_data'
CNT = 'step_count'
CAL = 'calorie'
DIS = 'distance'
SPE = 'speed'
REC = 'recommendation'
DAY = 'day_time'

with open(f'{ROOT_PATH}/com.samsung.shealth.tracker.pedometer_day_summary.202210101028.csv') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    i = 0
    head = []
    for row in reader:
        if i == 1:
            head = row.copy()
            #print(row)
            bin = int(row.index(BIN))
            cnt = row.index(CNT)
            cal = row.index(CAL)
            dis = row.index(DIS)
            spe = row.index(SPE)
            rec = row.index(REC)
            day = row.index(DAY)
            print(f'bin {bin}, cnt {cnt}, cal {cal}, dis {dis}, spe {spe}, rec {rec}, day {day}')

        if i > 1:
            binning_json = row[1]
            #print(f'{row[0]}, {row[1]}')
            rowjson = {}
            rowjson[BIN] = row[bin]
            rowjson[CNT] = row[cnt]
            rowjson[CAL] = row[cal]
            rowjson[DIS] = row[dis]
            rowjson[SPE] = row[spe]
            rowjson[REC] = row[rec]
            rowjson[DAY] = row[day]
            # print(rowjson)

            for f in glob.glob(f'{ROOT_PATH}/**/{rowjson[BIN]}', recursive=True):
                #print(f)
                with open(f, 'r') as data_file:
                    json_data = data_file.read()

                bins = json.loads(json_data)
                print(len(bins))

        i = i+1