import sys


def main():
    n = int(input())

    def read_case(remaining):
        if remaining == 0:
            return []
        x = int(input())
        values = input().split()
        if len(values) != x:
            return [-1] + read_case(remaining - 1)
        nums = list(map(int, values))
        total = sum(map(lambda y: y ** 4, filter(lambda y: y <= 0, nums)))
        return [total] + read_case(remaining - 1)

    results = read_case(n)

    def output(res):
        if res:
            print(res[0])
            output(res[1:])

    output(results)


if __name__ == "__main__":
    main()
