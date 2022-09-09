FROM continuumio/anaconda3
WORKDIR /app
COPY environment.yml .
RUN apt update && apt install -y libgles2-mesa-dev
RUN conda env create -f environment.yml
RUN echo "conda activate neuronal-motifs" >> ~/.bashrc
SHELL ["/bin/bash", "--login", "-c"]
COPY . /app
RUN chmod +x run.sh
EXPOSE 5050
ENTRYPOINT ["./run.sh"]