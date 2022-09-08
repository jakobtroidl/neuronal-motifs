FROM continuumio/anaconda3
WORKDIR /app
COPY environment.yml .
RUN apt update && apt install -y libgles2-mesa-dev
RUN conda env create -f environment.yml
SHELL ["conda", "run", "-n", "neuronal-motifs", "/bin/bash", "-c"]
COPY . /app
EXPOSE 5050
ENTRYPOINT ["conda", "run", "-n", "neuronal-motifs", "python", "main.py"]