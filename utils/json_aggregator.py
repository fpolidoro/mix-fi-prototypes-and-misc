import csv
import json
import glob
from datetime import datetime, timedelta, timezone

ROOT_PATH = '/home/fab/Scrivania/samsunghealth_202210101028'

BIN = 'binning_data'
CNT = 'step_count'
CAL = 'calorie'
DIS = 'distance'
SPE = 'speed'
REC = 'recommendation'
DAY = 'day_time'

with open(f'{ROOT_PATH}/com.samsung.shealth.tracker.pedometer_day_summary.202210101028.csv', 'r') as csvfiler:
    reader = csv.reader(csvfiler, delimiter=',')
    with open('exploded.csv', 'w') as csvfilew:
        writer = csv.writer(csvfilew)
        i = 0
        head = []
        for read in reader:
            if i == 1:
                head = read.copy()
                #print(row)
                bin = int(read.index(BIN))
                cnt = read.index(CNT)
                cal = read.index(CAL)
                dis = read.index(DIS)
                spe = read.index(SPE)
                rec = read.index(REC)
                day = read.index(DAY)
                print(f'bin {bin}, cnt {cnt}, cal {cal}, dis {dis}, spe {spe}, rec {rec}, day {day}')
                write = [DAY, CNT, DIS, CAL, SPE, REC]
                writer.writerow(write)

            if i > 1:
                binning_json = read[1]
                #print(f'{row[0]}, {row[1]}')
                rowjson = {}
                rowjson[BIN] = read[bin]
                rowjson[CNT] = read[cnt]
                rowjson[CAL] = read[cal]
                rowjson[DIS] = read[dis]
                rowjson[SPE] = read[spe]
                rowjson[REC] = read[rec]
                rowjson[DAY] = read[day]
                # print(rowjson)

                for f in glob.glob(f'{ROOT_PATH}/**/{rowjson[BIN]}', recursive=True):
                    #print(f)
                    with open(f, 'r') as data_file:
                        json_data = data_file.read()

                    bins = json.loads(json_data)
                    #print(len(bins))
                    j = 0
                    step_sum = 0
                    calories_sum = 0
                    distance_sum = 0
                    speed_sum = 0
                    snzc = 0

                    for item in bins:
                        j = j + 1
                        step_sum += int(item['mStepCount'])
                        calories_sum += float(item['mCalorie'])
                        distance_sum += float(item['mDistance'])
                        speed_sum += float(item['mSpeed'])
                        if float(item['mSpeed']) > 0.0: 
                            snzc += 1
                        if j%6 == 0:
                            daytime = datetime.utcfromtimestamp(int(rowjson[DAY])//1000) + timedelta(hours=(j//6))
                            speed_avg = speed_sum/snzc if snzc else 0
                            #print(f'[{j//6}] {daytime}, steps: {step_sum}, cals: {calories_sum}, dist: {distance_sum}, speed: {speed_avg}')
                            #[DAY, CNT, DIS, CAL, SPE, REC]
                            write = [int(daytime.replace(tzinfo=timezone.utc).timestamp()*1000), step_sum, distance_sum, calories_sum, speed_avg, rowjson[REC]]
                            writer.writerow(write)
                            step_sum = 0
                            calories_sum = 0
                            distance_sum = 0
                            speed_sum = 0
                            snzc = 0

            i = i+1