"""Dilipa — 二进制微补丁工具集.

依赖: pyelftools, capstone, click
打包: PyInstaller
"""
from setuptools import setup, find_packages

setup(
    name="dilipa",
    version="0.1.0",
    description="把二进制补丁表达为对提升后 C 代码的编辑",
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="BinInsight Team",
    license="MIT",
    packages=find_packages(exclude=["tests", "scripts"]),
    python_requires=">=3.9",
    install_requires=[
        "pyelftools>=0.29",
        "capstone>=5.0",
        "click>=8.0",
    ],
    entry_points={
        "console_scripts": [
            "dilipa=dilipa.cli:main",
        ],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Topic :: Security",
        "Topic :: Software Development :: Disassemblers",
    ],
)
