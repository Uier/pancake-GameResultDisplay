import csv
import json

import pprint

def read_csv(file_name):
	g = lambda l: any(map(len, l))
	with open(file_name) as f:
		c = list(csv.reader(f))
		c = map(lambda d: d[1:], c[2:])
		# c = list(filter(g, c))
	return c

def parse_csv(csv_file):
	info = [*zip(csv_file[3::4], csv_file[4::4])]
	json_file = {i: [0]*(int(info[0][1][i]) - int(csv_file[0][i])) for i in range(2)}
	for i in range(len(info) - 1):
		teams = map(int, info[i][0])
		tss = [*map(int, info[i][1])]
		next_tss = [*map(int, info[i + 1][1])]
		for j, team in enumerate(teams):
			json_file[j].extend([team]*max(next_tss[j] - tss[j], 5))
		max_len = max(map(len, json_file.values()))
		for k in json_file:
			json_file[k].extend([0]*(max_len - len(json_file[d])))

	print(json_file)

	for l in json_file.values():
		print(len(l))

if __name__ == '__main__':
	csv_file = read_csv('scoreboard.csv')
	parse_csv([*csv_file])
