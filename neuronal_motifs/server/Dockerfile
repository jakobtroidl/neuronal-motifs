FROM conda/miniconda3
WORKDIR /app
COPY environment.yml .
RUN apt update && apt install -y libgles2-mesa-dev libglu1-mesa-dev freeglut3-dev
RUN conda update conda
RUN conda env create -f environment.yml
RUN echo "conda activate neuronal-motifs" >> ~/.bashrc
SHELL ["/bin/bash", "--login", "-c"]
COPY . /app
ENTRYPOINT ["conda", "run","--no-capture-output", "-n", "neuronal-motifs", "uvicorn", "main:app", "--host", "0.0.0.0","--port", "80", "--log-level", "info"]
EXPOSE 80