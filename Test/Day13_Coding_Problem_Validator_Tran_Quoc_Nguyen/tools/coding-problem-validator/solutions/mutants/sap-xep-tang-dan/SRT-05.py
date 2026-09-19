n = int(input())
nums = list(map(int, input().split()))
nums.sort(key=str)
print(' '.join(map(str, nums)))